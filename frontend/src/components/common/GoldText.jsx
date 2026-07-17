import { memo } from "react";
import { GOLD_GRADIENT } from "../../constants/astrology.js";

function GoldText({ children, style = {} }) {
  return (
    <span style={{ background: GOLD_GRADIENT, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", ...style }}>
      {children}
    </span>
  );
}

export default memo(GoldText);
