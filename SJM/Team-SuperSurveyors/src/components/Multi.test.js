  import React from 'react';
  import { render, screen } from '@testing-library/react';
  import '@testing-library/jest-dom';
  import MultiChoiceAndSelect from './Multi';
  let lastBarProps = {};
  jest.mock('react-chartjs-2', () => ({
    Bar: (props) => {
      lastBarProps = props;
      return <div data-testid="bar-chart" />;
    },
  }));
  describe('MultiChoiceAndSelect – extra branch‑coverage tests', () => {
    beforeEach(() => {
        lastBarProps = {};
      });
    const choices = ['A', 'B', 'C'];
    test('renders an empty chart with no choices, no answers', () => {
        render(<MultiChoiceAndSelect choices={[]} answers={[]} />);
        const { data, options } = lastBarProps;
    
        // data.labels & data.datasets[0].data are empty arrays
        expect(data.labels).toEqual([]);
        expect(data.datasets[0].data).toEqual([]);
        // callback function is still present
        expect(typeof options.scales.y.ticks.callback).toBe('function');
      });
    
      test('counts matching answers only', () => {
        const choices = ['A', 'B', 'C'];
        const answers = ['A', 'A', 'B', 'X'];
    
        render(<MultiChoiceAndSelect choices={choices} answers={answers} />);
        const { data } = lastBarProps;
    
        // So the counts = [2,1,0]
        expect(data.datasets[0].data).toEqual([2, 1, 0]);
      });
    
      test('y-axis tick callback returns only integer ticks', () => {
        const choices = ['Yes'];
        const answers = ['Yes', 'Yes', 'Yes'];
        render(<MultiChoiceAndSelect choices={choices} answers={answers} />);
        const { options } = lastBarProps;
    
        const tickCb = options.scales.y.ticks.callback;
    
        // integer → returns integer
        expect(tickCb(3)).toBe(3);
        // float   → returns null
        expect(tickCb(2.5)).toBeNull();
      });
    
      test('verifies some chart options', () => {
        render(<MultiChoiceAndSelect choices={['X']} answers={['X']} />);
        const { options } = lastBarProps;
    
        // confirm that the chart is responsive, legend is top, etc.
        expect(options.responsive).toBe(true);
        expect(options.plugins.legend.position).toBe('top');
        // stepSize of 1
        expect(options.scales.y.ticks.stepSize).toBe(1);
        // beginAtZero: true
        expect(options.scales.y.beginAtZero).toBe(true);
      });
  });
  