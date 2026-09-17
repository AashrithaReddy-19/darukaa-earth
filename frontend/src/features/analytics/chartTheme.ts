import type { ChartOptions } from 'chart.js'

export const CHART_COLORS = {
  forest: '#276044',
  forestSoft: 'rgba(39, 96, 68, 0.15)',
  teal: '#19776c',
  tealSoft: 'rgba(25, 119, 108, 0.15)',
  sand: '#b99c5c',
  terracotta: '#b3402e',
  charcoal: '#4c5454',
  gridLine: '#e4e6e6',
}

export const CATEGORY_CHART_COLORS = [
  '#276044',
  '#19776c',
  '#b99c5c',
  '#37b3a1',
  '#1b3a2f',
  '#b3402e',
]

export const baseLineOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1a1f1f',
      titleFont: { family: 'Inter', size: 12, weight: 'bold' },
      bodyFont: { family: 'Inter', size: 12 },
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { family: 'Inter', size: 11 }, color: '#7c8484' },
    },
    y: {
      grid: { color: CHART_COLORS.gridLine },
      ticks: { font: { family: 'Inter', size: 11 }, color: '#7c8484' },
      beginAtZero: true,
    },
  },
}

export const baseBarOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1a1f1f',
      titleFont: { family: 'Inter', size: 12, weight: 'bold' },
      bodyFont: { family: 'Inter', size: 12 },
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { family: 'Inter', size: 11 }, color: '#7c8484' },
    },
    y: {
      grid: { color: CHART_COLORS.gridLine },
      ticks: { font: { family: 'Inter', size: 11 }, color: '#7c8484' },
      beginAtZero: true,
    },
  },
}

export const baseDoughnutOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '65%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: { font: { family: 'Inter', size: 11 }, color: '#4c5454', boxWidth: 10, padding: 12 },
    },
    tooltip: {
      backgroundColor: '#1a1f1f',
      titleFont: { family: 'Inter', size: 12, weight: 'bold' },
      bodyFont: { family: 'Inter', size: 12 },
      padding: 10,
      cornerRadius: 8,
    },
  },
}
