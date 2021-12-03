import { css } from '@emotion/css';

export const getButton = (id: string) => {
  const button = document.createElement('button');

  button.id = id;
  button.innerHTML = getHTML();
  button.classList.add(getCSS());

  return button;
};

const getHTML = () => `
  <div class="local-bias_excel_button-container">
    <svg viewBox="0 0 512 512">
      <g>
        <polygon
          points="388.032,45.654 388.032,83.077 474.573,83.077 474.573,428.961 388.032,428.961 388.032,466.388 512,466.388 512,45.654"
        ></polygon>
        <rect x="388.032" y="120.5" width="49.118" height="65.398"></rect>
        <rect x="388.032" y="223.321" width="49.118" height="65.397"></rect>
        <rect x="388.032" y="326.141" width="49.118" height="65.397"></rect>
        <path
          d="M365.768,6.654V6.502L0,47.382V464.61l365.768,40.887v-39.11v-37.427v-37.423v-65.397v-37.423v-65.397v-37.423
      V120.5V83.077V45.654V10.511l0.015-3.857H365.768z M166.588,213.232l0.042-0.069l0.092,0.149l30.311-51.083l0.982-1.637
      l36.441-1.686l12.022-0.575l6.45-0.225l-16.835,27.792l-39.06,64.369l-3.742,6.175l3.742,6.13l38.733,63.57l10.914,17.938
      l5.917,9.891l-18.141-0.838l-19.598-0.906l-17.771-0.967l-0.054-0.091l-30.311-51.593l-7.112,11.646l-22.781,37.374l-33.647-1.526
      l-15.707-0.788l53.846-89.838l-36.913-61.571l-17.41-29.185l49.084-2.242l23.527,38.314l4.809,7.812L166.588,213.232z"
        ></path>
      </g>
    </svg>
    <div>
      <div></div>
      <div></div>
    </div>
  </div>
`;

const getCSS = () => css`
  display: inline-block;
  width: 48px;
  height: 48px;
  min-width: 48px;
  padding: 0;
  margin-right: 8px;
  box-sizing: border-box;
  border: 1px solid #e3e7e8;
  background-color: #f7f9fa;

  :hover > div > svg {
    fill: #3495da;
  }

  > div {
    display: flex;
    justify-content: center;
    align-items: center;
    transition: all 0.4s ease;

    > svg {
      display: block;
      width: 30px;
      height: 30px;
      fill: #a8a8a8;
    }

    /* ローディングアニメーション */
    > div {
      display: none;
    }
  }

  &[disabled] > div {
    > svg {
      display: none;
    }
    > div {
      display: block;
      width: 30px;
      height: 30px;

      position: relative;
      margin: 0 auto;
      > div {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: #66a;
        opacity: 0.6;
        position: absolute;
        top: 0;
        left: 0;

        animation: local-bias_sk-bounce 2s infinite ease-in-out;

        :last-of-type {
          animation-delay: -1s;
        }
      }
    }
  }

  @keyframes local-bias_sk-bounce {
    0%,
    100% {
      transform: scale(0);
    }
    50% {
      transform: scale(1);
    }
  }
`;
