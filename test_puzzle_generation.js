#!/usr/bin/env node

// Test puzzle generation algorithm
function generatePuzzle() {
  // Generate solution with unique digits
  const solution = [];
  while (solution.length < 3) {
    const digit = Math.floor(Math.random() * 10);
    if (!solution.includes(digit)) {
      solution.push(digit);
    }
  }

  const availableDigits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].filter(d => !solution.includes(d));

  // Generate clue 1: One number correct but wrongly placed
  let clue1;
  do {
    clue1 = [];
    const solutionDigit = solution[Math.floor(Math.random() * 3)];
    let wrongPos;
    do {
      wrongPos = Math.floor(Math.random() * 3);
    } while (solution[wrongPos] === solutionDigit);
    clue1[wrongPos] = solutionDigit;
    
    // Fill other positions with non-solution digits
    for (let i = 0; i < 3; i++) {
      if (i !== wrongPos) {
        clue1[i] = availableDigits[Math.floor(Math.random() * availableDigits.length)];
      }
    }
  } while (clue1.some((num, idx) => num === solution[idx]) ||
           clue1.filter(num => solution.includes(num)).length !== 1);

  // Generate clue 2: One number correct but wrongly placed
  let clue2;
  do {
    clue2 = [];
    const solutionDigit = solution[Math.floor(Math.random() * 3)];
    let wrongPos;
    do {
      wrongPos = Math.floor(Math.random() * 3);
    } while (solution[wrongPos] === solutionDigit);
    clue2[wrongPos] = solutionDigit;
    
    // Fill other positions with non-solution digits
    for (let i = 0; i < 3; i++) {
      if (i !== wrongPos) {
        clue2[i] = availableDigits[Math.floor(Math.random() * availableDigits.length)];
      }
    }
  } while (clue2.some((num, idx) => num === solution[idx]) ||
           clue2.filter(num => solution.includes(num)).length !== 1 ||
           JSON.stringify(clue2) === JSON.stringify(clue1));

  // Generate clue 3: Two numbers correct and well placed
  let clue3;
  do {
    clue3 = [];
    const positions = [0, 1, 2];
    const selectedPositions = [];
    
    // Select 2 random positions
    for (let i = 0; i < 2; i++) {
      const posIndex = Math.floor(Math.random() * positions.length);
      selectedPositions.push(positions.splice(posIndex, 1)[0]);
    }
    
    // Place solution digits in correct positions
    selectedPositions.forEach(pos => {
      clue3[pos] = solution[pos];
    });
    
    // Fill remaining position with non-solution digit
    for (let i = 0; i < 3; i++) {
      if (clue3[i] === undefined) {
        clue3[i] = availableDigits[Math.floor(Math.random() * availableDigits.length)];
      }
    }
  } while (clue3.filter((num, idx) => num === solution[idx]).length !== 2 ||
           clue3.filter(num => solution.includes(num)).length !== 2);

  // Generate clue 4: Two numbers correct but wrongly placed
  let clue4;
  do {
    clue4 = [];
    const solutionDigits = [...solution];
    const usedPositions = [];
    
    // Place two solution digits in wrong positions
    for (let i = 0; i < 2; i++) {
      const digitIndex = Math.floor(Math.random() * solutionDigits.length);
      const digit = solutionDigits.splice(digitIndex, 1)[0];
      let pos;
      do {
        pos = Math.floor(Math.random() * 3);
      } while (usedPositions.includes(pos) || solution[pos] === digit);
      clue4[pos] = digit;
      usedPositions.push(pos);
    }
    
    // Fill remaining position with non-solution digit
    for (let i = 0; i < 3; i++) {
      if (clue4[i] === undefined) {
        clue4[i] = availableDigits[Math.floor(Math.random() * availableDigits.length)];
      }
    }
  } while (clue4.some((num, idx) => num === solution[idx]) ||
           clue4.filter(num => solution.includes(num)).length !== 2);

  // Generate clue 5: Nothing is correct
  let clue5;
  do {
    clue5 = [];
    for (let i = 0; i < 3; i++) {
      clue5[i] = availableDigits[Math.floor(Math.random() * availableDigits.length)];
    }
  } while (clue5.some(num => solution.includes(num)));

  return {
    solution,
    clues: [
      { numbers: clue1, hint: "One number is correct but wrongly placed" },
      { numbers: clue2, hint: "One number is correct but wrongly placed" },
      { numbers: clue3, hint: "Two numbers are correct and well placed" },
      { numbers: clue4, hint: "Two numbers are correct but wrongly placed" },
      { numbers: clue5, hint: "Nothing is correct" }
    ]
  };
}

function verifyPuzzle(puzzle) {
  const { solution, clues } = puzzle;
  let allValid = true;
  
  clues.forEach((clue, index) => {
    let correctAndWellPlaced = 0;
    let correctButWrongPlace = 0;
    
    // Check each position
    for (let i = 0; i < 3; i++) {
      const clueNumber = clue.numbers[i];
      const solutionNumber = solution[i];
      
      if (clueNumber === solutionNumber) {
        correctAndWellPlaced++;
      } else if (solution.includes(clueNumber)) {
        correctButWrongPlace++;
      }
    }
    
    // Verify the hint matches the actual result
    let expectedHint = '';
    const totalCorrect = correctAndWellPlaced + correctButWrongPlace;
    
    if (totalCorrect === 0) {
      expectedHint = 'Nothing is correct';
    } else if (correctAndWellPlaced === 2 && correctButWrongPlace === 0) {
      expectedHint = 'Two numbers are correct and well placed';
    } else if (correctAndWellPlaced === 0 && correctButWrongPlace === 2) {
      expectedHint = 'Two numbers are correct but wrongly placed';
    } else if (correctAndWellPlaced === 0 && correctButWrongPlace === 1) {
      expectedHint = 'One number is correct but wrongly placed';
    } else if (correctAndWellPlaced === 1 && correctButWrongPlace === 0) {
      expectedHint = 'One number is correct and well placed';
    } else {
      expectedHint = `${correctAndWellPlaced} well placed, ${correctButWrongPlace} wrong place`;
    }
    
    const matches = expectedHint === clue.hint;
    if (!matches) {
      console.log(`❌ PUZZLE ERROR in clue ${index + 1}:`);
      console.log(`  Clue: [${clue.numbers.join(', ')}] - "${clue.hint}"`);
      console.log(`  Expected: "${expectedHint}"`);
      console.log(`  Solution: [${solution.join(', ')}]`);
      allValid = false;
    }
  });
  
  return allValid;
}

// Test multiple puzzle generations
console.log('Testing puzzle generation algorithm...\n');

let validCount = 0;
let invalidCount = 0;
const testCount = 100;

for (let i = 0; i < testCount; i++) {
  const puzzle = generatePuzzle();
  const isValid = verifyPuzzle(puzzle);
  
  if (isValid) {
    validCount++;
  } else {
    invalidCount++;
    console.log(`\nInvalid puzzle ${i + 1}:`);
    console.log(`Solution: [${puzzle.solution.join(', ')}]`);
    puzzle.clues.forEach((clue, idx) => {
      console.log(`Clue ${idx + 1}: [${clue.numbers.join(', ')}] - "${clue.hint}"`);
    });
  }
}

console.log(`\n=== RESULTS ===`);
console.log(`Total puzzles tested: ${testCount}`);
console.log(`Valid puzzles: ${validCount}`);
console.log(`Invalid puzzles: ${invalidCount}`);
console.log(`Success rate: ${Math.round(validCount/testCount*100)}%`);

if (invalidCount === 0) {
  console.log('✅ All puzzles are logically sound!');
} else {
  console.log('❌ Some puzzles have logical errors!');
}
