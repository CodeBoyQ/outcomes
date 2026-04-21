import React from 'react';
import { getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';
import type { EdgeProps } from 'reactflow';
import { useStore } from '../store/useStore';

export const DependencyEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  selected,
}) => {
  const deleteDependency = useStore((s) => s.deleteDependency);

  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ stroke: selected ? '#8B7355' : '#C8BFB4', strokeWidth: selected ? 2.5 : 2 }}
        markerEnd={`url(#arrow-${selected ? 'selected' : 'default'})`}
        interactionWidth={16}
      />
      {selected && (
        <EdgeLabelRenderer>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteDependency(id);
            }}
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              background: '#fff',
              border: '1px solid #C8BFB4',
              borderRadius: '50%',
              width: 20,
              height: 20,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: '#8B7355',
              lineHeight: 1,
              boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
            }}
            title="Delete dependency"
          >
            ×
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
