/* --- REEMPLAZA TU COMPONENTE BOARD CON ESTA VERSIÓN ESTABILIZADA --- */

import React, { useCallback, useMemo, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import SynapseNode from './SynapseNode';
import { getLayoutedElements } from '../utils/layout';
import { supabase } from '../lib/supabase';

const nodeTypes = { synapse: SynapseNode };

const Board = ({ messages, isAdmin, userAlias, onReply, onDeleteMessage, onEditMessage }) => {
  const [isolatedId, setIsolatedId] = useState(null);

  const getDescendants = useCallback((parentId, allMessages, result = []) => {
    const children = allMessages.filter(m => m.parent_id === parentId);
    children.forEach(child => {
      result.push(child);
      getDescendants(child.id, allMessages, result);
    });
    return result;
  }, []);

  const { initialNodes, initialEdges } = useMemo(() => {
    if (!messages || messages.length === 0) return { initialNodes: [], initialEdges: [] };
    
    let visibleMessages = messages;
    if (isolatedId) {
      const rootNode = messages.find(m => m.id === isolatedId);
      const descendants = getDescendants(isolatedId, messages);
      visibleMessages = rootNode ? [rootNode, ...descendants] : messages;
    }

    let nodes = visibleMessages.map(msg => ({
      id: msg.id,
      type: 'synapse',
      data: {
        msg,
        isAdminView: isAdmin,
        userAlias,
        onReply,
        onDelete: onDeleteMessage,
        onEdit: onEditMessage,
        isRoot: !msg.parent_id,
        onIsolate: () => setIsolatedId(msg.id)
      },
      position: { x: msg.x_pos || 0, y: msg.y_pos || 0 }
    }));

    const seed = messages.find(m => !m.parent_id);
    const edges = visibleMessages
      .filter(msg => msg.id !== (isolatedId || seed?.id))
      .map(msg => {
        const defaultParent = isolatedId || seed?.id;
        const parentId = msg.parent_id || defaultParent;
        return {
          id: `e-${parentId}-${msg.id}`,
          source: parentId,
          target: msg.id,
          animated: true,
          style: { stroke: msg.color_theme || '#6366f1', strokeWidth: 1.2, opacity: 0.8 },
          markerEnd: { type: MarkerType.ArrowClosed, color: msg.color_theme || '#6366f1', width: 15, height: 15 },
        };
      });

    const layouted = getLayoutedElements(nodes, edges, 'LR');
    const finalNodes = layouted.nodes.map(node => {
      const msg = visibleMessages.find(m => m.id === node.id);
      if (msg && msg.x_pos) return { ...node, position: { x: msg.x_pos, y: msg.y_pos } };
      return node;
    });

    return { initialNodes: finalNodes, initialEdges: layouted.edges };
  }, [messages, isAdmin, userAlias, onReply, isolatedId, onDeleteMessage, onEditMessage]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // EFECTO DE SINCRONIZACIÓN CORREGIDO
  useEffect(() => {
    setNodes((nds) => {
      // Si el número de neuronas cambió, reseteamos el mapa
      if (initialNodes.length !== nds.length) return initialNodes;

      // Si el número es igual, actualizamos solo los datos internos (el texto)
      return nds.map(node => {
        const updated = initialNodes.find(n => n.id === node.id);
        if (updated && updated.data.msg.content !== node.data.msg.content) {
          return { ...node, data: updated.data };
        }
        return node;
      });
    });
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeDragStop = useCallback(async (event, node) => {
    if (!isAdmin) return;
    await supabase.from('intervenciones').update({ x_pos: Math.round(node.position.x), y_pos: Math.round(node.position.y) }).eq('id', node.id);
  }, [isAdmin]);

  return (
    <div className="w-full h-full bg-[#0a0a0c] relative">
      {isolatedId && (
        <button onClick={() => setIsolatedId(null)} className="absolute top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-2 bg-indigo-600/20 border border-indigo-500/50 text-indigo-400 text-[10px] font-black uppercase rounded-full backdrop-blur-md">
          ← Regresar a Conversación Global
        </button>
      )}
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop} nodeTypes={nodeTypes}
        fitView={nodes.length > 0 && nodes.every(n => n.position.x === 0)}
        nodesDraggable={isAdmin}
      >
        <Background color="#1e1e24" gap={40} size={1} variant="dots" className="opacity-10" />
        <Controls className="!bg-indigo-950/80 !border-indigo-500/50 !fill-indigo-400 hover:!fill-white shadow-lg" />
      </ReactFlow>
    </div>
  );
};

export default Board;