"use client";
import { Children, isValidElement } from 'react';

// Explicit editorial line breaks remain identical to the original markup.
export default function MotionHeading({ as: Tag = 'h2', children, ...props }) {
  const lines = [[]];
  Children.forEach(children, child => {
    if (isValidElement(child) && child.type === 'br') lines.push([]);
    else lines[lines.length - 1].push(child);
  });
  return <Tag {...props} data-motion-heading>{lines.map((line, index) =>
    <span key={index} data-motion-line style={{ display: 'block', color: 'inherit' }}>{line}</span>
  )}</Tag>;
}
