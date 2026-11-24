import type { ReactNode } from 'react';

export type PageTurnDirection = 'next' | 'prev';

interface PageTurnProps {
  direction: PageTurnDirection;
  /** 页标识（当前日期）；变化时重播翻页动画 */
  pageKey: string;
  children: ReactNode;
}

/**
 * 单页翻页容器：外层提供 3D 透视，内层按 pageKey 重挂载并播放
 * rotateY + 位移 + 透明度动画；系统要求减少动态时由 CSS 关闭。
 */
export function PageTurn({ direction, pageKey, children }: PageTurnProps) {
  return (
    <div className={`page-turn page-turn--${direction}`}>
      <div className="page-turn-sheet" key={pageKey}>
        {children}
      </div>
    </div>
  );
}