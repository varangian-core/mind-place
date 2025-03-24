"use client";

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableItem({ id, children, index }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
        opacity: isDragging ? 0.8 : 1,
        scale: isDragging ? 1.05 : 1,
        zIndex: isDragging ? 1 : 0,
        cursor: isDragging ? 'grabbing' : 'grab',
        boxShadow: isDragging ? '0 4px 20px rgba(0,0,0,0.2)' : 'none',
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...attributes} 
            {...listeners}
            className="sortable-item"
        >
            {children}
        </div>
    );
}
