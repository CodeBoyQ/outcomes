import React, { useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import type {
  Node,
  Edge,
  Connection,
  NodeMouseHandler,
  ReactFlowInstance,
} from 'reactflow';
import 'reactflow/dist/style.css';
import OutcomeNode from './OutcomeNode';
import { DependencyEdge } from './DependencyEdge';
import { useStore } from '../store/useStore';
import type { OutcomeStatus } from '../types/outcome';

const nodeTypes = { outcome: OutcomeNode };
const edgeTypes = { dependency: DependencyEdge };

function outcomeToNode(o: { id: string; title: string; status: OutcomeStatus; position_x: number; position_y: number }, selectedId: string | null): Node {
  return {
    id: o.id,
    type: 'outcome',
    position: { x: o.position_x, y: o.position_y },
    data: { title: o.title, status: o.status },
    selected: o.id === selectedId,
  };
}

export const GraphCanvas: React.FC = () => {
  const {
    outcomes,
    dependencies,
    selectedOutcomeId,
    selectOutcome,
    createOutcome,
    updatePosition,
    addDependency,
    deleteDependency,
    showToast,
  } = useStore();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const rfInstanceRef = useRef<ReactFlowInstance | null>(null);

  // Sync outcomes → nodes
  useEffect(() => {
    setNodes(outcomes.map((o) => outcomeToNode(o, selectedOutcomeId)));
  }, [outcomes, selectedOutcomeId]);

  // Sync dependencies → edges
  useEffect(() => {
    setEdges(
      dependencies.map((d) => ({
        id: d.id,
        source: d.from_outcome_id,
        target: d.to_outcome_id,
        type: 'dependency',
      }))
    );
  }, [dependencies]);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_e, node) => selectOutcome(node.id),
    [selectOutcome]
  );

  const onPaneClick = useCallback(() => selectOutcome(null), [selectOutcome]);

  const onPaneDoubleClick = useCallback(
    async (e: React.MouseEvent) => {
      if (!rfInstanceRef.current) return;
      const pos = rfInstanceRef.current.screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });
      const outcome = await createOutcome(pos.x, pos.y);
      if (outcome) selectOutcome(outcome.id);
    },
    [createOutcome, selectOutcome]
  );

  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      const result = await addDependency(connection.source, connection.target);
      if (!result.success) {
        showToast(result.error || 'Could not create dependency');
      }
    },
    [addDependency, showToast]
  );

  const onEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      edgesToDelete.forEach((e) => deleteDependency(e.id));
    },
    [deleteDependency]
  );

  const onNodeDragStop = useCallback(
    (_e: React.MouseEvent, node: Node) => {
      updatePosition(node.id, node.position.x, node.position.y);
    },
    [updatePosition]
  );

  const onNewOutcome = useCallback(async () => {
    let x = 300;
    let y = 200;
    if (rfInstanceRef.current) {
      const pos = rfInstanceRef.current.screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      x = pos.x;
      y = pos.y;
    }
    const outcome = await createOutcome(x, y);
    if (outcome) selectOutcome(outcome.id);
  }, [createOutcome, selectOutcome]);

  const isEmpty = outcomes.length === 0;

  return (
    <div style={{ flex: 1, position: 'relative', background: '#F5F2EE', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDoubleClick={onPaneDoubleClick}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        onNodeDragStop={onNodeDragStop}
        onInit={(instance) => {
          rfInstanceRef.current = instance;
        }}
        fitView
        deleteKeyCode="Delete"
        proOptions={{ hideAttribution: true }}
        style={{ background: '#F5F2EE', width: '100%', height: '100%' }}
      >
        <Background color="#DDD8D0" gap={24} size={1} />
        <Controls />
      </ReactFlow>

      {isEmpty && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, opacity: 0.3, marginBottom: 12 }}>○</div>
            <p style={{ color: '#9A9490', fontSize: 14, fontWeight: 500 }}>
              Double-click anywhere to create your first outcome
            </p>
          </div>
        </div>
      )}

      <button
        onClick={onNewOutcome}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 100,
          background: 'white',
          border: '1px solid #E8E2D9',
          color: '#3A3530',
          fontSize: 13,
          fontWeight: 500,
          padding: '8px 16px',
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          cursor: 'pointer',
        }}
      >
        + New Outcome
      </button>
    </div>
  );
};
