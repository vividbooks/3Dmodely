import { vividboardSetupUrl } from "../utils/vividboard";
import "./VividboardEmbedHint.css";

type Props = {
  boardId: string;
};

export function VividboardEmbedHint({ boardId }: Props) {
  const href = vividboardSetupUrl(boardId);
  return (
    <p className="vivid-pill">
      <span className="vivid-pill__lead">Chcete vložit 3D modely do svých materiálů?</span>
      <a href={href} target="_blank" rel="noopener noreferrer" className="vivid-pill__link">
        Otevřete si je jako vividboard
      </a>
    </p>
  );
}
