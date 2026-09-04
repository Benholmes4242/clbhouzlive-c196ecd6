import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScoreMark } from './ScoreMark';

const layers = (container: HTMLElement) =>
  [...container.querySelectorAll('span > span[aria-hidden="true"]')] as HTMLElement[];

const cssColor = (value: string) => {
  const node = document.createElement('span');
  node.style.color = value;
  return node.style.color;
};

const sameColor = (left: string, right: string) =>
  left.replaceAll(' ', '').toLowerCase() === right.replaceAll(' ', '').toLowerCase();

describe('ScoreMark dark scorecard convention', () => {
  it.each([
    { name: 'birdie', strokes: 3, par: 4, fill: '#C8372B', radius: '50%', rings: 0 },
    { name: 'eagle', strokes: 3, par: 5, fill: '#FFD200', radius: '50%', rings: 1 },
    { name: 'albatross', strokes: 2, par: 5, fill: '#FFD200', radius: '50%', rings: 2 },
    { name: 'double', strokes: 6, par: 4, fill: '#2F63A8', radius: '0%', rings: 0 },
    { name: 'triple', strokes: 7, par: 4, fill: '#1E4577', radius: '0%', rings: 1 },
  ])('renders $name', ({ strokes, par, fill, radius, rings }) => {
    const { container } = render(<ScoreMark strokes={strokes} par={par} surface="dark" />);
    const hidden = layers(container);
    const resolved = cssColor(fill);
    const fillLayer = hidden.find((node) => node.style.backgroundColor === resolved);
    expect(fillLayer).toBeDefined();
    expect(fillLayer?.style.borderRadius).toBe(radius);
    expect(hidden.filter((node) => sameColor(node.style.borderColor, resolved))).toHaveLength(rings);
  });

  it('renders bogey as an unfilled outlined square and par as plain ink', () => {
    const bogey = render(<ScoreMark strokes={5} par={4} surface="dark" />);
    expect(layers(bogey.container)).toHaveLength(1);
    expect(sameColor(layers(bogey.container)[0].style.borderColor, cssColor('rgba(248,250,252,0.55)'))).toBe(true);
    expect(layers(bogey.container)[0].style.background).toBe('');

    const par = render(<ScoreMark strokes={4} par={4} surface="dark" />);
    expect(layers(par.container)).toHaveLength(0);
  });

  it('makes an ace inherit its par-relative band', () => {
    const parThree = render(<ScoreMark strokes={1} par={3} surface="dark" />);
    expect(layers(parThree.container).filter((node) => sameColor(node.style.borderColor, cssColor('#FFD200')))).toHaveLength(1);

    const parFour = render(<ScoreMark strokes={1} par={4} surface="dark" />);
    expect(layers(parFour.container).filter((node) => sameColor(node.style.borderColor, cssColor('#FFD200')))).toHaveLength(2);
  });

  it('preserves the light double-plus treatment', () => {
    const double = render(<ScoreMark strokes={6} par={4} surface="light" />);
    const triple = render(<ScoreMark strokes={7} par={4} surface="light" />);
    expect(layers(double.container).map((node) => node.getAttribute('style'))).toEqual(
      layers(triple.container).map((node) => node.getAttribute('style')),
    );
  });
});