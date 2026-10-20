/**
 * Weaving threads around a glowing node. Brand gold instead of the original
 * amber; class names are prefixed so they can't clash with the app's CSS.
 */
export function WeaveSpinner({ size = 160 }: { size?: number }) {
  return (
    <>
      <style>{`
        .weave-wrapper { display: flex; justify-content: center; align-items: center; }
        .weave-container {
          position: relative;
          transform-style: preserve-3d;
          perspective: 1200px;
        }
        .weave-node {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 12px;
          height: 12px;
          background: #f0d38e;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 20px #e9c97a, 0 0 40px rgba(212, 175, 55, 0.6);
          animation: weave-node-pulse 1.6s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
        }
        .weave-thread {
          position: absolute;
          background: linear-gradient(90deg, transparent, rgba(233, 201, 122, 0.85), transparent);
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
          transform-origin: center;
        }
        .weave-t1 { width: 100%; height: 2px; top: 30%; left: 0; animation: weave-1 2s cubic-bezier(0.45, 0, 0.55, 1) infinite; }
        .weave-t2 { width: 2px; height: 100%; top: 0; left: 70%; animation: weave-2 2.2s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite; }
        .weave-t3 { width: 100%; height: 2px; bottom: 30%; left: 0; animation: weave-3 2.4s cubic-bezier(0.23, 1, 0.32, 1) infinite; }
        .weave-t4 { width: 2px; height: 100%; top: 0; left: 30%; animation: weave-4 2.6s cubic-bezier(0.36, 0, 0.66, -0.56) infinite; }

        @keyframes weave-node-pulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            box-shadow: 0 0 20px #e9c97a, 0 0 40px rgba(212, 175, 55, 0.6);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.4);
            box-shadow: 0 0 30px #e9c97a, 0 0 60px rgba(212, 175, 55, 0.8);
          }
        }
        @keyframes weave-1 {
          0%, 100% { transform: translateY(0) rotateX(0deg) rotateZ(0deg); opacity: 0.8; }
          50% { transform: translateY(40px) rotateX(60deg) rotateZ(20deg); opacity: 1; }
        }
        @keyframes weave-2 {
          0%, 100% { transform: translateX(0) rotateY(0deg) rotateZ(0deg); opacity: 0.8; }
          50% { transform: translateX(-40px) rotateY(60deg) rotateZ(-20deg); opacity: 1; }
        }
        @keyframes weave-3 {
          0%, 100% { transform: translateY(0) rotateX(0deg) rotateZ(0deg); opacity: 0.8; }
          50% { transform: translateY(-40px) rotateX(-60deg) rotateZ(15deg); opacity: 1; }
        }
        @keyframes weave-4 {
          0%, 100% { transform: translateX(0) rotateY(0deg) rotateZ(0deg); opacity: 0.8; }
          50% { transform: translateX(40px) rotateY(-60deg) rotateZ(-15deg); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .weave-node, .weave-thread { animation-duration: 6s; }
        }
      `}</style>
      <div className="weave-wrapper" role="status" aria-label="Loading">
        <div className="weave-container" style={{ width: size, height: size }}>
          <div className="weave-thread weave-t1" />
          <div className="weave-thread weave-t2" />
          <div className="weave-thread weave-t3" />
          <div className="weave-thread weave-t4" />
          <div className="weave-node" />
        </div>
      </div>
    </>
  );
}
