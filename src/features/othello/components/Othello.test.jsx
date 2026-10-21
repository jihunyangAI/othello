import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import App from '../../../app/App.jsx';
beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function () {
      this.setAttribute('open', '');
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value: function () {
      this.removeAttribute('open');
    },
  });
});
afterAll(() => {
  delete HTMLDialogElement.prototype.showModal;
  delete HTMLDialogElement.prototype.close;
});
const cell = (coordinate) =>
  screen.getByRole('button', { name: new RegExp(`^${coordinate},`) });
function fixture(board) {
  return {
    board,
    currentPlayer: 'black',
    status: 'playing',
    revision: 0,
    lastTransition: null,
  };
}
describe('Othello 사용자 흐름', () => {
  it('AC-02~04 합법수·착수·무효 입력을 표시한다', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(document.querySelectorAll('[data-legal="true"]')).toHaveLength(4);
    await user.click(cell('A1'));
    expect(
      screen.getByRole('status', { name: '게임 안내' }).textContent,
    ).toMatch(/착수|둘 수/);
    expect(screen.getByLabelText('흑 돌 개수')).toHaveTextContent('2');
    await user.click(cell('D3'));
    expect(screen.getByLabelText('흑 돌 개수')).toHaveTextContent('4');
    expect(screen.getByLabelText('백 돌 개수')).toHaveTextContent('1');
    expect(
      screen.getByRole('heading', { name: '백 차례' }),
    ).toBeInTheDocument();
    expect(cell('D4')).toHaveAttribute('data-value', 'black');
  });
  it('AC-11 취소·Escape·확인과 초점 복원', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(cell('D3'));
    const reset = screen.getByRole('button', { name: '새 게임', exact: true });
    await user.click(reset);
    expect(screen.getByRole('button', { name: '계속하기' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: '새 게임 시작' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: '계속하기' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(reset).toHaveFocus();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await user.click(reset);
    await user.click(screen.getByRole('button', { name: '계속하기' }));
    expect(screen.getByLabelText('흑 돌 개수')).toHaveTextContent('4');
    await user.click(reset);
    await user.click(screen.getByRole('button', { name: '새 게임 시작' }));
    expect(screen.getByLabelText('흑 돌 개수')).toHaveTextContent('2');
    expect(cell('D3')).toHaveAttribute('tabindex', '0');
    expect(reset).toHaveFocus();
    cell('D3').focus();
    await user.keyboard('{Enter}');
    expect(cell('D3')).toHaveFocus();
    await user.keyboard('{ArrowLeft}');
    expect(cell('C3')).toHaveFocus();
  });
  it('AC-12·13 방향 경계·단일 Tab 진입·Enter·Space·길게 누름', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(
      document.querySelectorAll('[data-value][tabindex="0"]'),
    ).toHaveLength(1);
    await user.tab();
    expect(cell('D3')).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByLabelText('흑 돌 개수')).toHaveTextContent('4');
    await user.keyboard('{ArrowLeft}');
    expect(cell('C3')).toHaveFocus();
    fireEvent.keyDown(cell('C3'), { key: ' ', repeat: true });
    expect(screen.getByLabelText('백 돌 개수')).toHaveTextContent('1');
    await user.keyboard(' ');
    expect(screen.getByLabelText('백 돌 개수')).toHaveTextContent('3');
    cell('A1').focus();
    await user.keyboard('{ArrowLeft}{ArrowUp}');
    expect(cell('A1')).toHaveFocus();
    cell('H8').focus();
    await user.keyboard('{ArrowRight}{ArrowDown}');
    expect(cell('H8')).toHaveFocus();
  });
  it('AC-07 자동 패스와 다음 합법수를 안내한다', async () => {
    const board = Array(64).fill('black');
    board[0] = null;
    board[63] = null;
    board[1] = 'white';
    board[62] = 'white';
    const user = userEvent.setup();
    render(<App initialState={fixture(board)} />);
    await user.click(cell('A1'));
    expect(
      screen.getByRole('heading', { name: '흑 차례' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('status', { name: '게임 안내' }).textContent,
    ).toMatch(/백.*패스/);
    expect(cell('H8')).toHaveAttribute('data-legal', 'true');
  });
  it('AC-08·10 빈칸을 남겨 종료하고 입력을 닫으며 즉시 새 게임한다', async () => {
    const board = Array(64).fill('black');
    board[0] = null;
    board[1] = null;
    board[2] = 'white';
    const user = userEvent.setup();
    render(<App initialState={fixture(board)} />);
    await user.click(cell('B1'));
    expect(
      screen.getByRole('heading', { name: '흑 승리' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('흑 돌 개수')).toHaveTextContent('63');
    await user.click(cell('A1'));
    expect(cell('A1')).toHaveAttribute('data-value', 'empty');
    expect(document.querySelectorAll('[data-legal="true"]')).toHaveLength(0);
    await user.click(
      screen.getByRole('button', { name: '새 게임', exact: true }),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '흑 차례' }),
    ).toBeInTheDocument();
  });
  it('AC-09 가득 찬 동률을 표시한다', async () => {
    const board = Array.from({ length: 64 }, (_, index) =>
      index < 32 ? 'black' : 'white',
    );
    board[0] = null;
    board[1] = 'white';
    const user = userEvent.setup();
    render(<App initialState={fixture(board)} />);
    await user.click(cell('A1'));
    expect(screen.getByRole('heading', { name: '무승부' })).toBeInTheDocument();
    expect(screen.getByLabelText('흑 돌 개수')).toHaveTextContent('32');
    expect(screen.getByLabelText('백 돌 개수')).toHaveTextContent('32');
  });
});
