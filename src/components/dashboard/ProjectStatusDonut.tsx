import React from "react";

interface ProjectStatusSegment {
  status: string;
  name: string;
  value: number;
  color: string;
}

interface ProjectStatusDonutProps {
  activeStatus: string | null;
  data: ProjectStatusSegment[];
  onSelect: (status: string) => void;
}

const SIZE = 192;
const CENTER = SIZE / 2;
const BASE_STROKE = 22;
const ACTIVE_STROKE = 28;
const RADIUS = CENTER - ACTIVE_STROKE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const ProjectStatusDonut = React.forwardRef<SVGSVGElement, ProjectStatusDonutProps>(
  ({ activeStatus, data, onSelect }, ref) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) {
      return (
        <svg ref={ref} viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-48 w-48" aria-hidden="true">
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={BASE_STROKE}
          />
        </svg>
      );
    }

    let offset = 0;

    return (
      <svg ref={ref} viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-48 w-48" aria-label="Proje durum dağılımı" role="img">
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={BASE_STROKE}
        />

        {data.map((entry) => {
          const segmentLength = (entry.value / total) * CIRCUMFERENCE;
          const currentOffset = offset;
          offset += segmentLength;

          return (
            <circle
              key={entry.status}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={entry.color}
              strokeWidth={activeStatus === entry.status ? ACTIVE_STROKE : BASE_STROKE}
              strokeDasharray={`${segmentLength} ${CIRCUMFERENCE - segmentLength}`}
              strokeDashoffset={-currentOffset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
              className="cursor-pointer transition-all duration-200"
              opacity={activeStatus && activeStatus !== entry.status ? 0.3 : 1}
              onClick={() => onSelect(entry.status)}
            >
              <title>{`${entry.name}: ${entry.value}`}</title>
            </circle>
          );
        })}
      </svg>
    );
  }
);

ProjectStatusDonut.displayName = "ProjectStatusDonut";

export default ProjectStatusDonut;
