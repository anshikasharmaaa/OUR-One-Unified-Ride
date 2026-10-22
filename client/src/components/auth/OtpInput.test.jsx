import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OtpInput from './OtpInput';

function Harness() {
  const [v, setV] = useState('');
  return (<><OtpInput value={v} onChange={setV} /><output data-testid="val">{v}</output></>);
}

describe('OtpInput', () => {
  test('typing advances focus through the six boxes', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const boxes = screen.getAllByRole('textbox');
    expect(boxes).toHaveLength(6);
    await user.click(boxes[0]);
    await user.keyboard('123');
    expect(screen.getByTestId('val')).toHaveTextContent('123');
    expect(boxes[3]).toHaveFocus();
  });

  test('pasting a code fills every box and ignores non-digits', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getAllByRole('textbox')[0]);
    await user.paste('48 29-17');
    expect(screen.getByTestId('val')).toHaveTextContent('482917');
  });

  test('backspace on an empty box clears the previous digit and moves back', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const boxes = screen.getAllByRole('textbox');
    await user.click(boxes[0]);
    await user.keyboard('12');
    await user.keyboard('{Backspace}');
    expect(screen.getByTestId('val')).toHaveTextContent('1');
    expect(boxes[1]).toHaveFocus();
  });

  test('the first box allows OS one-time-code autofill and every box is labelled', () => {
    render(<Harness />);
    const boxes = screen.getAllByRole('textbox');
    expect(boxes[0]).toHaveAttribute('autocomplete', 'one-time-code');
    expect(boxes[5]).toHaveAccessibleName('Digit 6 of 6');
  });
});
