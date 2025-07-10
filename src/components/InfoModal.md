# InfoModal Component Documentation

## Overview
The `InfoModal` component is a reusable modal that displays informational content for different sections of the application. It centralizes all modal content in one place, making it easy to edit and maintain.

## Usage
```jsx
<InfoModal 
  isOpen={showModal} 
  onClose={() => setShowModal(false)} 
  type="modalType" 
/>
```

## Available Modal Types
- `personaeMapping` - Information about the Personae Mapping section
- `behavioralDiversity` - Information about the Behavioral Diversity section  
- `situationDesign` - Information about the Situation Design section

## How to Edit Modal Content

### 1. Location
All modal content is defined in `src/components/InfoModal.jsx` in the `INFO_CONTENT` object.

### 2. Structure
Each modal type has:
- `title`: The modal header text
- `content`: The JSX content to display

### 3. Editing Content
To edit the content of any modal:

1. Open `src/components/InfoModal.jsx`
2. Find the modal type you want to edit in the `INFO_CONTENT` object
3. Modify the `title` or `content` as needed
4. Save the file

### 4. Example Edit
To change the Personae Mapping title:
```jsx
personaeMapping: {
  title: "Your New Title Here",
  content: (
    // ... existing content
  )
}
```

To add new content sections, follow the existing pattern with styled divs, headers, and lists.

### 5. Adding New Modal Types
To add a new modal type:

1. Add a new entry to `INFO_CONTENT`
2. Use the new type when calling `<InfoModal type="newType" />`

## Styling
The modal uses inline styles that match the application's design system:
- Colors: `#2c3e50`, `#3498db`, `#27ae60`, `#e67e22`
- Font: `Lexend, sans-serif`
- Consistent spacing and borders

## Benefits
- **Centralized**: All modal content in one file
- **Reusable**: Same modal component for all sections
- **Maintainable**: Easy to find and edit content
- **Consistent**: Uniform styling and behavior across modals 