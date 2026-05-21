"use client";

import { Line, Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const BLUE = "#2563eb";
const ORANGE = "#ea580c";
const GRID = "rgba(17,24,39,0.06)";

const baseOpts = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { backgroundColor: "#1a1813", padding: 10, cornerRadius: 8 },
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: "#5e5b4d" } },
    y: { grid: { color: GRID }, ticks: { color: "#5e5b4d" } },
  },
};

export function LineChart({ labels, values, label = "Score %" }) {
  return (
    <div style={{ height: 220 }}>
      <Line
        data={{
          labels,
          datasets: [
            {
              label,
              data: values,
              borderColor: BLUE,
              backgroundColor: "rgba(37, 99, 235, 0.12)",
              tension: 0.35,
              fill: true,
              pointBackgroundColor: BLUE,
              pointBorderColor: "#fff",
              pointRadius: 4,
            },
          ],
        }}
        options={baseOpts}
      />
    </div>
  );
}

export function BarChart({ labels, values, label = "Average %" }) {
  return (
    <div style={{ height: 240 }}>
      <Bar
        data={{
          labels,
          datasets: [
            {
              label,
              data: values,
              backgroundColor: labels.map((_, i) => (i % 2 === 0 ? BLUE : ORANGE)),
              borderRadius: 6,
              barThickness: 22,
            },
          ],
        }}
        options={baseOpts}
      />
    </div>
  );
}

export function DoughnutChart({ labels, values, colors }) {
  return (
    <div style={{ height: 220 }}>
      <Doughnut
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: colors || [BLUE, ORANGE, "#9a9789"],
              borderWidth: 0,
            },
          ],
        }}
        options={{
          ...baseOpts,
          plugins: { ...baseOpts.plugins, legend: { display: true, position: "bottom", labels: { color: "#5e5b4d", boxWidth: 12 } } },
          scales: {},
        }}
      />
    </div>
  );
}
