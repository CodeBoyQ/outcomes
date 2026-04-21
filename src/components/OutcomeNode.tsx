import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { OutcomeStatus } from '../types/outcome';

const statusColors: Record<OutcomeStatus, string> = {
  todo: '#E8E2D9',
  wait: '#C4B8D4',
  inprogress: '#D4A87A',
  done: '#9AB89A',
};

const statusBorder: Record<OutcomeStatus, string> = {
  todo: '#D4CCC0',
  wait: '#A898BE',
  inprogress: '#B88858',
  done: '#7A9E7A',
};

interface NodeData {
  title: string;
  status: OutcomeStatus;
  isSelected: boolean;
}

const OutcomeNode: React.FC<NodeProps<NodeData>> = ({ data, selected }) => {
  const bgColor = statusColors[data.status];
  const borderColor = statusBorder[data.status];

  return (
    <div className="flex flex-col items-center" style={{ width: 80 }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: bgColor,
          border: `2.5px solid ${borderColor}`,
          boxShadow: selected
            ? `0 0 0 3px ${borderColor}44, 0 4px 12px rgba(0,0,0,0.12)`
            : '0 2px 8px rgba(0,0,0,0.10)',
          transition: 'box-shadow 0.15s ease',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <Handle
          type="source"
          position={Position.Right}
          style={{
            background: borderColor,
            width: 10,
            height: 10,
            border: '2px solid white',
            right: -5,
          }}
        />
        <Handle
          type="target"
          position={Position.Left}
          style={{
            background: borderColor,
            width: 10,
            height: 10,
            border: '2px solid white',
            left: -5,
          }}
        />
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 11,
          fontWeight: 500,
          color: '#4A4540',
          textAlign: 'center',
          maxWidth: 80,
          lineHeight: 1.3,
          wordBreak: 'break-word',
        }}
      >
        {data.title || 'Untitled'}
      </div>
    </div>
  );
};

export default memo(OutcomeNode);
