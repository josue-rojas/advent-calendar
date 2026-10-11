import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';

function visit(url: string) {
  window.history.pushState({}, '', url);
}

function setToday(iso: string) {
  jest.useFakeTimers('modern');
  jest.setSystemTime(new Date(`${iso}T12:00:00`));
}

const candleButtons = () => screen.queryAllByRole('button', { name: /^Day \d+$/ });

afterEach(() => {
  jest.useRealTimers();
  window.localStorage.clear();
});

test('before the runway starts there are no candles and a friendly message', () => {
  setToday('2026-10-20');
  visit('/advent-calendar/');
  render(<App />);
  expect(screen.getByText('Almost time')).toBeInTheDocument();
  expect(screen.queryByText(/Hacks/)).not.toBeInTheDocument();
  expect(candleButtons()).toHaveLength(0);
  expect(screen.getByText(/first candle goes on the cake on November 2/)).toBeInTheDocument();
});

test('the gift and the cake share a page; the cake has a candle for every day up to today', () => {
  setToday('2026-11-09');
  visit('/advent-calendar/#11.09.2026');
  render(<App />);
  expect(screen.getByText('Flowers that last')).toBeInTheDocument();
  expect(screen.getByText(/8 of 30 candles are on the cake/)).toBeInTheDocument();
  expect(candleButtons()).toHaveLength(8);
});

test('opening an older day does not change the cake', () => {
  setToday('2026-11-09');
  visit('/advent-calendar/#11.03.2026');
  render(<App />);
  expect(screen.getByText('Chunks!')).toBeInTheDocument();
  expect(candleButtons()).toHaveLength(8);
});

test('a future day is locked and adds no candle', () => {
  setToday('2026-11-09');
  visit('/advent-calendar/#11.12.2026');
  render(<App />);
  expect(screen.getByText('Not yet')).toBeInTheDocument();
  expect(candleButtons()).toHaveLength(8);
});

test('?preview unlocks a future day and shows the cake as of that date', () => {
  setToday('2026-11-09');
  visit('/advent-calendar/?preview#11.20.2026');
  render(<App />);
  expect(screen.queryByText('Not yet')).not.toBeInTheDocument();
  expect(candleButtons()).toHaveLength(19);
});

test('opening the same link repeatedly stores nothing and never double-counts', () => {
  setToday('2026-11-09');
  visit('/advent-calendar/#11.09.2026');
  render(<App />).unmount();
  render(<React.StrictMode><App /></React.StrictMode>);
  expect(candleButtons()).toHaveLength(8);
  expect(window.localStorage.length).toBe(0);
});

test('tapping a candle on the cake opens that day', () => {
  setToday('2026-11-09');
  visit('/advent-calendar/#11.09.2026');
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Day 1' }));
  expect(window.location.hash).toBe('#11.02.2026');
});

test('the birthday (Dec 2) floats balloons up; other days still drop their emoji', () => {
  setToday('2026-12-02');
  visit('/advent-calendar/#12.02.2026');
  const birthday = render(<App />);
  const flakes = birthday.container.querySelector('.snowflakes');
  expect(flakes).toHaveClass('rise');
  expect(flakes).toHaveTextContent('🎈');
  birthday.unmount();

  visit('/advent-calendar/#11.09.2026');
  const day8 = render(<App />);
  expect(day8.container.querySelector('.snowflakes')).not.toHaveClass('rise');
});

test('on Dec 2 all 30 candles are on the cake; lighting them dims the room and shows the note', () => {
  setToday('2026-12-02');
  visit('/advent-calendar/');
  const { container } = render(<App />);
  expect(screen.getByText('All thirty candles are here.')).toBeInTheDocument();
  expect(candleButtons()).toHaveLength(30);
  expect(container.querySelector('.App')).not.toHaveClass('lit');

  fireEvent.click(screen.getByText('Light the candles'));
  expect(container.querySelector('.App')).toHaveClass('lit');
  expect(screen.getByText('Make a wish.')).toBeInTheDocument();
  act(() => { jest.advanceTimersByTime(2000); });
  expect(container.querySelector('.noteView')).toHaveClass('show');
});
