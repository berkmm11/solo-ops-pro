import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import useMeasure from "react-use-measure";

interface InfiniteSliderProps {
  children: ReactNode;
  speed?: number;
  gap?: number;
  direction?: "left" | "right";
}

const InfiniteSlider = ({
  children,
  speed = 30,
  gap = 48,
  direction = "left",
}: InfiniteSliderProps) => {
  const [ref, { width }] = useMeasure();
  const innerRef = useRef<HTMLDivElement>(null);
  const [innerWidth, setInnerWidth] = useState(0);

  useEffect(() => {
    if (innerRef.current) {
      setInnerWidth(innerRef.current.scrollWidth);
    }
  }, [children]);

  if (!innerWidth) {
    return (
      <div className="overflow-hidden">
        <div ref={innerRef} className="flex" style={{ gap }}>
          {children}
        </div>
      </div>
    );
  }

  const duration = innerWidth / speed;

  return (
    <div ref={ref} className="overflow-hidden">
      <motion.div
        className="flex"
        style={{ gap }}
        animate={{
          x: direction === "left" ? [0, -(innerWidth + gap)] : [-(innerWidth + gap), 0],
        }}
        transition={{
          x: {
            repeat: Infinity,
            repeatType: "loop",
            duration,
            ease: "linear",
          },
        }}
      >
        <div ref={innerRef} className="flex shrink-0" style={{ gap }}>
          {children}
        </div>
        <div className="flex shrink-0" style={{ gap }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
};

export default InfiniteSlider;
