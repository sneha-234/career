'use client';

import { useEffect, useRef } from 'react';
import { mountAssessment } from './assessment';

export default function AssessmentScreen({ admin = false }) {
  const appRoot = useRef(null);
  const modalRoot = useRef(null);

  useEffect(() => {
    let active = true;
    let dispose;
    // Avoid counting React's development effect replay as an assessment reload.
    queueMicrotask(() => {
      if (active) dispose = mountAssessment(appRoot.current, modalRoot.current, { admin });
    });
    return () => {
      active = false;
      dispose?.();
    };
  }, [admin]);

  return (
    <>
      <div id="app" ref={appRoot} />
      <div id="modal" ref={modalRoot} />
    </>
  );
}
