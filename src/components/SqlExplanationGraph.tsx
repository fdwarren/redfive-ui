import React from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";

const SqlExplanationGraph = ({ explanation }) => {
  const nodes = explanation.tables.map((t, i) => ({
    id: t,
    position: { x: 100 * i, y: 100 * i },
    data: { label: t },
    type: "default"
  }));

  const edges = (explanation.relationships || []).map((r, i) => ({
    id: `e${i}`,
    source: r.from_table,
    target: r.to_table,
    label: r.join_type
  }));

  return (
    <div style={{ width: 600, height: 400 }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default SqlExplanationGraph;

