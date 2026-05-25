function i(r,t=8){const e=Number(r||0);return!Number.isFinite(e)||e===0?"0.00":Math.abs(e)>=1?e.toFixed(2):e.toFixed(t).replace(/0+$/,"").replace(/\.$/,"")}export{i as f};
