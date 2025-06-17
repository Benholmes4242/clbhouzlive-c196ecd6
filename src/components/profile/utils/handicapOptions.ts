
export const generateHandicapOptions = () => {
  const options = [];
  
  // Add positive handicaps from +10.0 down to +0.1
  for (let i = 100; i >= 1; i--) {
    const value = i / 10;
    options.push({
      value: (-value).toString(),
      label: `+${value.toFixed(1)}`
    });
  }
  
  // Add 0.0
  options.push({
    value: "0",
    label: "0.0"
  });
  
  // Add regular handicaps from 0.1 to 50.0
  for (let i = 1; i <= 500; i++) {
    const value = i / 10;
    options.push({
      value: value.toString(),
      label: value.toFixed(1)
    });
  }
  
  return options;
};
