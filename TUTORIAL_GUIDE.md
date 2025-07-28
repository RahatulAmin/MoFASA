# MoFASA Interactive Tutorial System

This document explains how to use and extend the interactive tutorial system built into MoFASA.

## 🎯 Overview

The tutorial system uses **React Joyride** to provide step-by-step guided tours of the application. It includes:

- **Automatic tutorials** for new users
- **On-demand tutorials** accessible via the floating help button
- **Context-aware guidance** for different parts of the app
- **Progress tracking** with localStorage persistence

## 🚀 How to Use Tutorials

### Starting Your First Tutorial

1. **New User Experience**: When you first open MoFASA, the "Getting Started" tutorial will automatically begin
2. **Context-Aware Help**: Click the 💡 button in the bottom-right corner to start the tutorial for your current page
3. **Smart Guidance**: The help button changes based on where you are in the app

### Available Tutorials

| Tutorial | Description | Where It Appears |
|----------|-------------|------------------|
| **Getting Started** | Basic introduction to MoFASA | Projects page |
| **Project Overview** | Navigate project features | Project details page |
| **Participant Interview** | Conduct personae mapping interviews | Participant interview page |

### How the Help Button Works

- **💡 Blue Button**: Tutorial available for this page
- **✅ Green Button**: Tutorial already completed for this page
- **One Click**: Instantly starts the relevant tutorial for your current page
- **Smart Context**: Shows different tutorials based on where you are

### Tutorial Controls

- **Next**: Continue to the next step
- **Previous**: Go back to the previous step
- **Skip Tour**: Exit the current tutorial
- **Close**: End the tutorial at any step

## 🛠 Technical Implementation

### Key Components

#### 1. **TutorialManager** (`src/components/TutorialManager.jsx`)
- Manages tutorial state and progress
- Provides floating help button
- Handles auto-starting tutorials for new users

#### 2. **Tutorial** (`src/components/Tutorial.jsx`)
- Contains all tutorial step definitions
- Manages React Joyride configuration
- Handles tutorial events and navigation

#### 3. **TutorialTrigger** (`src/components/TutorialTrigger.jsx`)
- Optional component for context-specific tutorial triggers
- Includes visual indicators for tutorial availability

### Adding New Tutorials

To add a new tutorial, follow these steps:

#### 1. Define Tutorial Steps

Add your tutorial steps to the `tutorialSteps` object in `Tutorial.jsx`:

```javascript
newTutorial: [
  {
    target: '.your-css-selector',
    content: (
      <div>
        <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Step Title</h3>
        <p style={{ margin: 0, lineHeight: 1.5 }}>
          Your step description here.
        </p>
      </div>
    ),
    placement: 'bottom'
  },
  // Add more steps...
]
```

#### 2. Add to Tutorial Menu

Update `TutorialManager.jsx` to include your new tutorial in the menu:

```javascript
<TutorialMenuItem
  title="Your Tutorial"
  description="Brief description"
  onClick={() => startTutorial('newTutorial')}
  completed={tutorialProgress.newTutorial?.completed}
/>
```

#### 3. Add CSS Classes to Target Elements

Ensure your target elements have the correct CSS classes or selectors:

```javascript
<div className="your-target-element">
  Content that tutorial will highlight
</div>
```

### Tutorial Step Configuration

Each tutorial step supports these options:

```javascript
{
  target: '.css-selector',           // Element to highlight
  content: <ReactElement>,          // Tutorial content (JSX)
  placement: 'top|bottom|left|right', // Tooltip position
  disableBeacon: true,              // Hide the initial beacon
  spotlightPadding: 10,             // Space around highlighted element
  offset: 10,                       // Tooltip offset from target
  isFixed: true,                    // For fixed position elements
  hideFooter: true,                 // Hide tutorial controls
  locale: { next: 'Continue' }      // Custom button text
}
```

## 🎨 Styling and Customization

### Tutorial Styles

The tutorial uses a custom theme defined in `Tutorial.jsx`:

```javascript
const tutorialStyles = {
  options: {
    primaryColor: '#3498db',        // Main theme color
    textColor: '#2c3e50',          // Text color
    backgroundColor: '#ffffff',     // Background color
    overlayColor: 'rgba(0, 0, 0, 0.4)', // Overlay color
    zIndex: 10000,                 // Z-index for tutorial
  },
  tooltip: {
    fontFamily: 'Lexend, sans-serif',
    borderRadius: '12px',
    maxWidth: '400px'
  }
  // ... more styling options
};
```

### CSS Classes

The following CSS classes are used for tutorial targeting:

- `.projects-header` - Projects page header
- `.add-project-button` - Add project button
- `.left-panel` - Project details left panel
- `.questionnaire-section` - Participant questionnaire
- `.framework-panel` - Personae framework visualization
- `.generate-summary-button` - AI summary generation button

## 📊 Progress Tracking

### How Progress is Stored

Tutorial progress is automatically saved to localStorage:

```javascript
{
  "gettingStarted": {
    "completed": true,
    "completedAt": "2024-01-15T10:30:00.000Z"
  },
  "projectCreation": {
    "completed": true,
    "completedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

### Resetting Progress

Users can reset their tutorial progress by:
1. Opening the tutorial menu
2. Clicking "Reset all tutorials" at the bottom

Developers can reset programmatically:
```javascript
localStorage.removeItem('mofasa_tutorial_progress');
```

## 🔧 Advanced Features

### Context-Aware Tutorials

Tutorials can be automatically triggered based on:
- Current route/page
- User actions
- Application state

### Auto-Starting Logic

```javascript
useEffect(() => {
  if (isNewUser() && location.pathname === '/projects') {
    setTimeout(() => {
      startTutorial('gettingStarted');
    }, 1000);
  }
}, [tutorialProgress, location.pathname]);
```

### Tutorial Events

You can listen to tutorial events:

```javascript
const handleJoyrideCallback = (data) => {
  const { status, type, index, action } = data;
  
  if (type === EVENTS.STEP_AFTER) {
    // Step completed
  } else if (status === STATUS.FINISHED) {
    // Tutorial completed
  }
};
```

## 🐛 Troubleshooting

### Common Issues

#### 1. **Tutorial Not Starting**
- Check if target elements exist in the DOM
- Verify CSS selectors are correct
- Ensure tutorial type is properly defined

#### 2. **Steps Not Highlighting Correctly**
- Target element might not be visible
- CSS selector might be too specific or too generic
- Element might be dynamically rendered

#### 3. **Tutorial Appears Cut Off**
- Adjust `placement` property
- Check `zIndex` values
- Modify `offset` or `spotlightPadding`

### Debugging Tips

1. **Console Logging**: Enable logging in tutorial callback
2. **Element Inspector**: Verify target elements exist
3. **Style Inspector**: Check CSS selector specificity
4. **Local Storage**: Clear tutorial progress for testing

## 🌟 Best Practices

### Writing Effective Tutorials

1. **Keep Steps Focused**: One concept per step
2. **Use Clear Language**: Avoid technical jargon
3. **Logical Flow**: Follow user's natural workflow
4. **Visual Hierarchy**: Use headings and formatting
5. **Actionable Content**: Tell users exactly what to do

### Technical Best Practices

1. **Reliable Selectors**: Use stable CSS classes, not brittle selectors
2. **Responsive Design**: Test tutorials on different screen sizes
3. **Performance**: Avoid too many simultaneous tutorials
4. **Accessibility**: Ensure tutorials work with screen readers
5. **Error Handling**: Handle missing target elements gracefully

## 📝 Contributing

When adding new features that need tutorials:

1. Add appropriate CSS classes to new components
2. Create tutorial steps for complex workflows  
3. Update this documentation
4. Test tutorials thoroughly before deployment

---

**Need Help?** The tutorial system is designed to be self-documenting, but if you need assistance extending it, refer to the [React Joyride Documentation](https://react-joyride.com/) for advanced features. 