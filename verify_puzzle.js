#!/usr/bin/env node

// Verify puzzle logic
const solution = [0, 8, 2];
const clues = [
    { numbers: [2, 7, 1], hint: "One number is correct but wrongly placed" },
    { numbers: [1, 1, 8], hint: "One number is correct but wrongly placed" },
    { numbers: [6, 8, 2], hint: "Two numbers are correct and well placed" },
    { numbers: [3, 0, 8], hint: "Two numbers are correct but wrongly placed" },
    { numbers: [3, 4, 7], hint: "Nothing is correct" }
];

console.log('Solution:', solution.join(''));
console.log('\nVerifying each clue:');

clues.forEach((clue, index) => {
    console.log(`\nClue ${index + 1}: [${clue.numbers.join(', ')}] - "${clue.hint}"`);
    
    let correctAndWellPlaced = 0;
    let correctButWrongPlace = 0;
    let totalCorrect = 0;
    
    // Check each position
    for (let i = 0; i < 3; i++) {
        const clueNumber = clue.numbers[i];
        const solutionNumber = solution[i];
        
        if (clueNumber === solutionNumber) {
            correctAndWellPlaced++;
            totalCorrect++;
            console.log(`  Position ${i + 1}: ${clueNumber} = ${solutionNumber} (correct and well placed)`);
        } else if (solution.includes(clueNumber)) {
            correctButWrongPlace++;
            totalCorrect++;
            console.log(`  Position ${i + 1}: ${clueNumber} is in solution but wrong place`);
        } else {
            console.log(`  Position ${i + 1}: ${clueNumber} is not in solution`);
        }
    }
    
    console.log(`  Summary: ${correctAndWellPlaced} well placed, ${correctButWrongPlace} wrong place, ${totalCorrect} total correct`);
    
    // Verify the hint matches the actual result
    let expectedHint = '';
    if (totalCorrect === 0) {
        expectedHint = 'Nothing is correct';
    } else if (correctAndWellPlaced === 2 && correctButWrongPlace === 0) {
        expectedHint = 'Two numbers are correct and well placed';
    } else if (correctAndWellPlaced === 1 && correctButWrongPlace === 1) {
        expectedHint = 'One number is correct and well placed, one number is correct but wrongly placed';
    } else if (correctAndWellPlaced === 1 && correctButWrongPlace === 0) {
        expectedHint = 'One number is correct and well placed';
    } else if (correctAndWellPlaced === 0 && correctButWrongPlace === 2) {
        expectedHint = 'Two numbers are correct but wrongly placed';
    } else if (correctAndWellPlaced === 0 && correctButWrongPlace === 1) {
        expectedHint = 'One number is correct but wrongly placed';
    } else {
        expectedHint = `${correctAndWellPlaced} well placed, ${correctButWrongPlace} wrong place`;
    }
    
    const matches = expectedHint === clue.hint;
    console.log(`  Expected: "${expectedHint}"`);
    console.log(`  Actual: "${clue.hint}"`);
    console.log(`  ✓ Matches: ${matches ? 'YES' : 'NO'}`);
    
    if (!matches) {
        console.log('  ❌ PUZZLE ERROR DETECTED!');
    }
});
