# Hello World Website | Git Branching and Merging Lab

## Project Overview

This project was created as part of my Git lab assignment to practice branch management, merging, and resolving merge conflicts. I used my animated Hello World website to complete the Git tasks while learning how changes from different branches are managed in a real project.

The website includes interactive animations, colorful styling, and JavaScript effects. Alongside the website, this repository demonstrates how to work with multiple Git branches and handle conflicts when the same CSS code is modified differently.

## Technologies Used

- HTML5
- CSS3
- JavaScript
- Git
- GitHub
- Visual Studio Code

## Website Features

- Animated Hello World text
- Interactive buttons and visual effects
- Colorful backgrounds and smooth transitions
- Responsive layout
- JavaScript-powered animations

## Git Lab Tasks

### 1. Repository Setup
Initialized a local Git repository, created the project files, and committed the initial version to the main branch.

### 2. Parallel Branch Creation
Created two separate branches from main to work on different changes independently.

### 3. Clean Merge
Updated the CSS styling in branch-1, committed the changes, and merged the branch into main without conflicts.

### 4. Merge Conflict
Modified the same CSS property differently in branch-2 and main. Attempted to merge branch-2 into main to demonstrate a merge conflict.

### 5. Conflict Resolution
Manually resolved the CSS conflict, removed the conflict markers, and completed the merge.

### 6. Commit History
Used the following command to inspect the complete branch and merge history:

`git log --graph --oneline --all --decorate`

## Project Structure

```text
RollNumber_Section_GitLab/
├── index.html
├── index.css
├── script.js
└── README.md
```

## How to Run

1. Clone or download the repository.
2. Open the project folder in Visual Studio Code.
3. Open `index.html` in a web browser.
4. Interact with the website to explore its animations.

## What I Learned

Through this project, I practiced creating and switching between Git branches, committing changes, merging branches, identifying merge conflicts, and resolving them manually.

I also learned how Git maintains the history of changes and how separate development branches can be combined into a single project.

## Conclusion

This lab helped me understand the practical use of Git branching and merging. Using my Hello World website made it easier to see how CSS changes from different branches affect the same project and how Git conflicts can be resolved while preserving the final website.
