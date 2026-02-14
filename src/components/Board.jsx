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

  // Función recursiva para encontrar la descendencia completa de una neurona
  const getDescendants = useCallback((parentId, allMessages, result = []) => {
    const children = allMessages.filter(m => m.parent_id === parentId);
    children.forEach(child => {
      result.push(child);
      getDescendants(child.id, allMessages, result);
    });
    return result;
  }, []);

  // 1. PROCESAMIENTO ESTRUCTURAL DE LA RED (Nodos y Conexiones)
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!messages || messages.length === 0) return { initialNodes: [], initialEdges: [] };

    // --- LÓGICA DE AISLAMIENTO (Focus en rama específica) ---
    let visibleMessages = messages;
    if (isolatedId) {
      const rootNode = messages.find(m => m.id === isolatedId);
      const descendants = getDescendants(isolatedId, messages);
      visibleMessages = rootNode ? [rootNode, ...descendants] : messages;
    }

    // Mapeo de Mensajes a Neuronas (Nodes)
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
      position: { x: msg.x_pos || 0, y: msg.y_pos || 0 },
      // Marca de posición manual para preservar la topología editada por el docente
      hasManualPosition: msg.x_pos !== null && msg.x_pos !== undefined && msg.x_pos !== 0
    }));

    // Mapeo de Sinapsis (Edges)
    const seed = visibleMessages.find(m => !m.parent_id);
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
          type: 'default',
          style: {
            stroke: msg.color_theme || '#6366f1',
            strokeWidth: 1.2,
            opacity: 0.8
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: msg.color_theme || '#6366f1',
            width: 15, height: 15
          },
        };
      });

    // Cálculo de Layout Automático (Dagre) para nuevos aportes
    const layouted = getLayoutedElements(nodes, edges, 'LR');

    const finalNodes = layouted.nodes.map(node => {
      const msg = visibleMessages.find(m => m.id === node.id);
      
      // PRIORIDAD CRÍTICA: Respetar la posición persistida en la DB si existe
      if (msg && msg.x_pos !== null && msg.x_pos !== undefined && msg.x_pos !== 0) {
        return {
          ...node,
          position: { x: msg.x_pos, y: msg.y_pos }
        };
      }
      return node;
    });

    return { initialNodes: finalNodes, initialEdges: layouted.edges };
  }, [messages, isAdmin, userAlias, onReply, isolatedId, getDescendants, onDeleteMessage, onEditMessage]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 2. EFECTO DE SINCRONIZACIÓN DINÁMICA
  useEffect(() => {
    setNodes((nds) => {
      // Si el número de neuronas cambió, regeneramos el mapa completo
      if (initialNodes.length !== nds.length) return initialNodes;

      // Si el número es igual, buscamos actualizaciones de contenido (ediciones/inhibiciones)
      // Esto evita que las burbujas "salten" al editar el texto
      return nds.map(node => {
        const fresh = initialNodes.find(n => n.id === node.id);
        if (fresh && fresh.data.msg.content !== node.data.msg.content) {
          console.log(`👁️ [BOARD] Reconfigurando visualización de neurona: ${node.id}`);
          return { ...node, data: fresh.data };
        }
        return node;
      });
    });
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // 3. PERSISTENCIA DE TOPOLOGÍA (Drag & Drop del Docente)
  const onNodeDragStop = useCallback(async (event, node) => {
    if (!isAdmin) return;
    const { id, position } = node;

    const { error } = await supabase
      .from('intervenciones')
      .update({
        x_pos: Math.round(position.x),
        y_pos: Math.round(position.y)
      })
      .eq('id', id);

    if (error) console.error("❌ [BOARD] Error al sincronizar posición:", error);
  }, [isAdmin]);

  return (
    <div className="w-full h-full bg-[#0a0a0c] relative">
      {/* Indicador de Aislamiento de Rama */}
      {isolatedId && (
        <button
          onClick={() => setIsolatedId(null)}
          className="absolute top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-2 bg-indigo-600/20 border border-indigo-500/50 text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-indigo-500 hover:text-white transition-all backdrop-blur-md shadow-[0_0_20px_rgba(99,102,241,0.3)]"
        >
          ← Regresar a Conversación Global
        </button>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        nodeTypes={nodeTypes}
        fitView={nodes.length > 0 && nodes.every(n => n.position.x === 0)}
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.05}
        maxZoom={2}
        nodesDraggable={isAdmin}
      >
        <Background color="#1e1e24" gap={40} size={1} variant="dots" className="opacity-10" />
        <Controls className="!bg-indigo-950/80 !border-indigo-500/50 !fill-indigo-400 hover:!fill-white shadow-[0_0_15px_rgba(99,102,241,0.3)]" />
      </ReactFlow>
    </div>
  );
};

export default Board;