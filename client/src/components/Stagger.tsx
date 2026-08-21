import React, { Children, isValidElement, cloneElement } from 'react';

type StaggerAs = 'div' | 'ul' | 'ol' | 'section' | 'main' | 'header' | 'nav';

interface StaggerProps {
  as?: StaggerAs;
  /** Delay between each child, in ms. Default 60. */
  step?: number;
  /** Initial delay before the first child, in ms. Default 0. */
  initialDelay?: number;
  /** CSS class applied to the wrapper. Default 'civic-stagger-children'. */
  className?: string;
  /** CSS class applied to each child. Default 'civic-fade-up'. */
  enterClass?: string;
  children: React.ReactNode;
}

export const Stagger: React.FC<StaggerProps> = ({
  as = 'div',
  step = 60,
  initialDelay = 0,
  className = 'civic-stagger-children',
  enterClass = 'civic-fade-up',
  children,
}) => {
  const arr = Children.toArray(children);
  const items = arr.map((child, i) => {
    if (!isValidElement(child)) return child;
    const existing = (child.props as { className?: string; style?: React.CSSProperties });
    const mergedClass = [existing.className, enterClass].filter(Boolean).join(' ');
    const existingStyle = existing.style ?? {};
    const mergedStyle = {
      ...existingStyle,
      '--civic-stagger-i': i,
    } as React.CSSProperties;
    return cloneElement(child as React.ReactElement, {
      className: mergedClass,
      style: mergedStyle,
    });
  });

  const Wrapper = as;
  const wrapperStyle = {
    '--civic-stagger-step': `${step}ms`,
  } as React.CSSProperties;

  return (
    <Wrapper className={className} style={initialDelay ? { ...wrapperStyle, animationDelay: `${initialDelay}ms` } : wrapperStyle}>
      {items}
    </Wrapper>
  );
};

export default Stagger;
