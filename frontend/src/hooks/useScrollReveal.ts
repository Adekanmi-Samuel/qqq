"use client";

import { useEffect, useRef, useState, createElement } from "react";

interface UseScrollRevealOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  delay?: number;
  triggerOnce?: boolean;
  animationClass?: string;
}

/**
 * Custom hook for scroll-triggered animations using IntersectionObserver
 * Replace initial-load CSS animations with scroll-based reveals
 */
export function useScrollReveal(options: UseScrollRevealOptions = {}) {
  const {
    threshold = 0.1,
    root = null,
    rootMargin = "0px 0px -50px 0px",
    delay = 0,
    triggerOnce = true,
    animationClass = "animate-fade-up opacity-0-init",
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<Element>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) observer.disconnect();
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        root,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, triggerOnce]);

  return { ref, isVisible };
}

/**
 * Custom hook for stagger-based scroll reveals
 * Sequentially animates elements in a container
 */
export function useScrollRevealStagger(options: UseScrollRevealOptions & { staggerDelay?: number } = {}) {
  const {
    staggerDelay = 100,
    ...rest
  } = options;

  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const containerRef = useRef<Element>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const children = Array.from(element.children);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Reveal all children with staggered delay
          children.forEach((_, index) => {
            setTimeout(() => {
              setVisibleItems(prev => [...prev, index]);
            }, index * staggerDelay);
          });
          if (options.triggerOnce) observer.disconnect();
        } else if (!options.triggerOnce) {
          setVisibleItems([]);
        }
      },
      {
        threshold: options.threshold,
        root: options.root,
        rootMargin: options.rootMargin,
      }
    );

    children.forEach(child => observer.observe(child));

    return () => {
      observer.disconnect();
    };
  }, [options.triggerOnce, options.threshold, options.root, options.rootMargin, staggerDelay]);

  return { containerRef, visibleItems };
}

/**
 * Higher-order component HOC for scroll reveal
 */

export function withScrollReveal<P extends object>(
  WrappedComponent: React.ElementType,
  animationOptions: UseScrollRevealOptions = {}
) {
  const displayName = (WrappedComponent as any).displayName || (WrappedComponent as any).name || "Component";

  const ScrollRevealComponent = (props: P) => {
    const { ref: elementRef, isVisible } = useScrollReveal(animationOptions);
    return createElement(WrappedComponent, { ...(props as any), ref: elementRef, isVisible });
  };

  ScrollRevealComponent.displayName = `withScrollReveal(${displayName})`;
  return ScrollRevealComponent;
}