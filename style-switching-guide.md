# 🎨 Style Switching Instructions

This document contains instructions for quickly switching between different visual styles for your rage room website.

## 📁 Available Styles

### 1. **Hip-Hop Graffiti Style** (Current)
- **File**: `styles-hip-hop-graffiti.css`
- **Colors**: Yellow bubble letters, purple shadows, street black outlines
- **Vibe**: Authentic old-school graffiti, boom boxes, spray cans
- **Reference**: Yellow/purple bubble letter graffiti image

### 2. **Rage Room Interface Style**
- **File**: `styles-rage-room.css`
- **Colors**: Burgundy/purple backgrounds, pink/orange accents
- **Vibe**: Professional rage room interface, premium feel
- **Reference**: "The Shatter Space" interface panels

## 🔄 How to Switch Styles

### Method 1: Replace CSS Variables (Quick)
1. Open your main `styles.css` file
2. Find the `:root {` section at the top (around line 8)
3. Replace the entire `:root { ... }` block with the one from your chosen style file

### Method 2: Full File Replacement
1. Copy the entire content from your chosen style file
2. Replace the CSS variables section in your main `styles.css`

## 🎯 Key Elements to Update When Switching

### For Hip-Hop Graffiti Style:
```css
/* Main colors */
--graffiti-yellow: #ffcc00;
--bubble-purple: #6633cc;
--street-black: #000000;

/* Logo style */
.logo {
  color: var(--graffiti-yellow);
  -webkit-text-stroke: 3px var(--street-black);
  filter: drop-shadow(4px 4px 0px var(--bubble-purple));
}

/* Background */
background: radial-gradient(circle at 20% 30%, var(--graffiti-yellow) 0%, transparent 15%);
```

### For Rage Room Interface Style:
```css
/* Main colors */
--rage-burgundy: #4a1a2c;
--vibrant-pink: #ff0080;
--electric-orange: #ff6600;

/* Logo style */
.logo {
  background: linear-gradient(45deg, var(--neon-yellow), var(--vibrant-pink));
  -webkit-background-clip: text;
}

/* Background */
background: linear-gradient(135deg, var(--rage-burgundy) 0%, var(--deep-purple) 100%);
```

## 🚀 Quick Switch Commands

### To Hip-Hop Graffiti:
1. Copy variables from `styles-hip-hop-graffiti.css`
2. Update logo to yellow with black outline
3. Update background to street wall with spray splatters

### To Rage Room Interface:
1. Copy variables from `styles-rage-room.css`
2. Update logo to gradient text effect
3. Update background to burgundy/purple gradients

## 💡 Tips for Custom Styles

- **Colors**: Always update the `:root` variables first
- **Logo**: The logo style is in the `.logo` class around line 320
- **Background**: The body background is around line 50
- **Headers**: Header styling starts around line 250
- **Cards**: Card styling starts around line 600

## 🎨 Creating New Styles

1. Copy one of the existing style files
2. Rename it (e.g., `styles-neon-cyber.css`)
3. Update the color variables in `:root`
4. Modify specific element styles as needed
5. Add entry to this instruction file

## 📋 Style Checklist

When switching styles, make sure to update:
- [ ] `:root` CSS variables
- [ ] `.logo` styling
- [ ] `body` background
- [ ] `header` background
- [ ] `.nav-links a` colors
- [ ] `.card` backgrounds
- [ ] `.submit-btn` styling
- [ ] Form input styling

---

**Last Updated**: August 7, 2025
**Current Active Style**: Hip-Hop Graffiti (Yellow/Purple Bubble Letters)
