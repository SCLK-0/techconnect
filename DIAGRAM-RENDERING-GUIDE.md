# PlantUML Diagram Rendering Guide

**Purpose:** Step-by-step guide to convert PlantUML diagrams to images for your thesis

---

## 📋 Overview

You have 46 PlantUML diagrams across 3 files:
- `diagrams/01-authentication-diagrams.md` - 10 diagrams
- `diagrams/02-session-management-diagrams.md` - 20 diagrams
- `diagrams/03-video-session-diagrams.md` - 16 diagrams

This guide shows you how to render them as images for your thesis document.

---

## 🎯 Method 1: Online Rendering (Easiest)

### Step 1: Access PlantUML Online Editor
Visit: http://www.plantuml.com/plantuml/uml/

### Step 2: Copy Diagram Code
1. Open one of the diagram files (e.g., `diagrams/01-authentication-diagrams.md`)
2. Find a diagram code block (between ```plantuml and ```)
3. Copy everything from `@startuml` to `@enduml` (inclusive)

### Step 3: Paste and Render
1. Paste the code into the online editor
2. The diagram will render automatically
3. Right-click the diagram → "Save image as..."
4. Save with descriptive name (e.g., `fig-3-1-user-registration.png`)

### Step 4: Repeat for All Diagrams
- Recommended naming convention:
  - `fig-3-1-user-registration-activity.png`
  - `fig-3-2-user-registration-sequence.png`
  - `fig-3-3-email-verification-activity.png`
  - etc.

### Pros:
✅ No installation required  
✅ Works on any device  
✅ Instant preview  

### Cons:
❌ Manual process for each diagram  
❌ Requires internet connection  
❌ One diagram at a time  

---

## 🎯 Method 2: VS Code Extension (Recommended)

### Step 1: Install Extension
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "PlantUML"
4. Install "PlantUML" by jebbs

### Step 2: Install Java (Required)
PlantUML requires Java to run:
- Download from: https://www.java.com/download/
- Install and restart VS Code

### Step 3: Install Graphviz (Required)
- Windows: Download from https://graphviz.org/download/
- Mac: `brew install graphviz`
- Linux: `sudo apt-get install graphviz`

### Step 4: Extract Diagrams to .puml Files
Create individual `.puml` files for each diagram:

**Example: `user-registration-activity.puml`**
```plantuml
@startuml
skinparam conditionStyle diamond

rectangle "**TechConnect - User Registration Process**" {
  start
  :Navigate to role selection;
  // ... rest of diagram code
  stop
}

@enduml
```

### Step 5: Render Diagrams
1. Open a `.puml` file in VS Code
2. Press `Alt+D` to preview
3. Right-click preview → "Export Current Diagram"
4. Choose format (PNG recommended, 300 DPI for print)
5. Save to `thesis-images/` folder

### Step 6: Batch Export (Optional)
- Right-click on `diagrams/` folder
- Select "Export Workspace Diagrams"
- All diagrams exported at once!

### Pros:
✅ Batch export capability  
✅ High-quality output  
✅ Offline rendering  
✅ Preview while editing  

### Cons:
❌ Requires installation  
❌ Needs Java + Graphviz  
❌ Initial setup time  

---

## 🎯 Method 3: Command Line (Advanced)

### Step 1: Install PlantUML
Download `plantuml.jar` from: https://plantuml.com/download

### Step 2: Install Java
Same as Method 2

### Step 3: Create Individual .puml Files
Extract each diagram to separate `.puml` files

### Step 4: Render Single Diagram
```bash
java -jar plantuml.jar diagram.puml
```

### Step 5: Render All Diagrams in Folder
```bash
java -jar plantuml.jar diagrams/*.puml
```

### Step 6: Specify Output Format
```bash
# PNG (default)
java -jar plantuml.jar -tpng diagram.puml

# SVG (vector, scalable)
java -jar plantuml.jar -tsvg diagram.puml

# High DPI PNG
java -jar plantuml.jar -tpng -Sdpi=300 diagram.puml
```

### Pros:
✅ Scriptable/automatable  
✅ Batch processing  
✅ High control over output  

### Cons:
❌ Command line knowledge required  
❌ Manual file extraction  
❌ More complex setup  

---

## 🎯 Method 4: IntelliJ IDEA / PyCharm (If Available)

### Step 1: Built-in Support
IntelliJ IDEA and PyCharm have built-in PlantUML support

### Step 2: Create .puml Files
Same as other methods

### Step 3: Right-Click Diagram
- Right-click in editor
- Select "Export to PNG/SVG"
- Choose location and format

### Pros:
✅ Integrated in IDE  
✅ Easy export  
✅ Good preview  

### Cons:
❌ Requires IntelliJ/PyCharm  
❌ Not free (unless using Community Edition)  

---

## 📁 Recommended Folder Structure

Create this structure for organized thesis images:

```
thesis-images/
├── chapter-3/
│   ├── authentication/
│   │   ├── fig-3-1-user-registration-activity.png
│   │   ├── fig-3-2-user-registration-sequence.png
│   │   ├── fig-3-3-email-verification-activity.png
│   │   └── ...
│   ├── session-management/
│   │   ├── fig-3-11-request-scheduled-activity.png
│   │   ├── fig-3-12-request-scheduled-sequence.png
│   │   └── ...
│   └── video-sessions/
│       ├── fig-3-31-join-session-learner-activity.png
│       ├── fig-3-32-join-session-learner-sequence.png
│       └── ...
└── architecture/
    └── system-architecture-diagram.png
```

---

## 🎨 Image Quality Settings

### For Digital Thesis (PDF)
- **Format:** PNG
- **DPI:** 150-200
- **Size:** 1200-1600px width
- **File size:** 100-500 KB per image

### For Printed Thesis
- **Format:** PNG or SVG
- **DPI:** 300
- **Size:** 2400-3200px width
- **File size:** 500 KB - 2 MB per image

### For Presentation Slides
- **Format:** PNG
- **DPI:** 96-150
- **Size:** 1920px width (Full HD)
- **File size:** 200-800 KB per image

---

## 📝 Diagram Naming Convention

Use consistent naming for easy reference:

**Pattern:** `fig-[chapter]-[section]-[name]-[type].png`

**Examples:**
- `fig-3-1-user-registration-activity.png`
- `fig-3-1-user-registration-sequence.png`
- `fig-3-2-email-verification-activity.png`
- `fig-3-2-email-verification-sequence.png`
- `fig-3-3-user-login-activity.png`
- `fig-3-3-user-login-sequence.png`

**Or simpler:**
- `fig-3-01.png` (User Registration Activity)
- `fig-3-02.png` (User Registration Sequence)
- `fig-3-03.png` (Email Verification Activity)
- etc.

---

## 🔧 Troubleshooting

### Issue: Diagram doesn't render
**Solution:** Check for syntax errors in PlantUML code
- Missing `@startuml` or `@enduml`
- Unclosed `if` statements (missing `endif`)
- Unclosed `fork` statements (missing `end fork`)
- Unclosed rectangles (missing `}`)

### Issue: Text is too small
**Solution:** Increase DPI or add to diagram:
```plantuml
@startuml
skinparam defaultFontSize 14
skinparam defaultFontName Arial
' ... rest of diagram
@enduml
```

### Issue: Diagram is cut off
**Solution:** PlantUML auto-sizes, but you can adjust:
```plantuml
@startuml
scale 1.5
' ... rest of diagram
@enduml
```

### Issue: Colors look wrong
**Solution:** Ensure proper theme or add:
```plantuml
@startuml
skinparam backgroundColor white
skinparam shadowing false
' ... rest of diagram
@enduml
```

### Issue: Java not found (VS Code)
**Solution:** 
1. Install Java JDK
2. Add Java to PATH
3. Restart VS Code
4. Check: `java -version` in terminal

---

## 📊 Quick Extraction Script

If you want to extract all diagrams to individual files, here's a Python script:

**`extract_diagrams.py`**
```python
import re
import os

def extract_diagrams(input_file, output_dir):
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all PlantUML code blocks
    pattern = r'```plantuml\s*(@startuml.*?@enduml)\s*```'
    diagrams = re.findall(pattern, content, re.DOTALL)
    
    os.makedirs(output_dir, exist_ok=True)
    
    for i, diagram in enumerate(diagrams, 1):
        filename = f"{output_dir}/diagram-{i:02d}.puml"
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(diagram)
        print(f"Extracted: {filename}")

# Usage
extract_diagrams('diagrams/01-authentication-diagrams.md', 'puml-files/auth')
extract_diagrams('diagrams/02-session-management-diagrams.md', 'puml-files/session')
extract_diagrams('diagrams/03-video-session-diagrams.md', 'puml-files/video')
```

Run with: `python extract_diagrams.py`

---

## ✅ Rendering Checklist

### Before Rendering
- [ ] Choose rendering method
- [ ] Install required tools (if needed)
- [ ] Create output folder structure
- [ ] Decide on naming convention
- [ ] Determine image quality settings

### During Rendering
- [ ] Render all 46 diagrams
- [ ] Check each image for quality
- [ ] Verify text is readable
- [ ] Ensure proper sizing
- [ ] Save with consistent naming

### After Rendering
- [ ] Organize images in folders
- [ ] Create image index/list
- [ ] Test images in thesis document
- [ ] Verify figure numbers match
- [ ] Backup images to cloud/USB

---

## 🎯 Recommended Workflow

**For 12-15 Essential Diagrams (Inline in Thesis):**
1. Use **Method 2 (VS Code)** for best quality
2. Render at **300 DPI** for print
3. Save as **PNG**
4. Name systematically (fig-3-01, fig-3-02, etc.)
5. Insert directly in thesis document

**For Remaining 31-34 Diagrams (Appendix):**
1. Use **Method 1 (Online)** for speed
2. Render at **150 DPI** (sufficient for appendix)
3. Save as **PNG**
4. Name with appendix prefix (fig-a-01, fig-a-02, etc.)
5. Compile into appendix section

**For Presentation Slides:**
1. Select 3-5 most impressive diagrams
2. Render at **150 DPI**
3. Save as **PNG**
4. Optimize file size if needed
5. Insert in PowerPoint/Google Slides

---

## 📚 Additional Resources

**PlantUML Documentation:**
- Official guide: https://plantuml.com/guide
- Activity diagrams: https://plantuml.com/activity-diagram-beta
- Sequence diagrams: https://plantuml.com/sequence-diagram

**Tools:**
- Online editor: http://www.plantuml.com/plantuml/uml/
- VS Code extension: Search "PlantUML" in extensions
- Desktop app: PlantUML QEditor

**Image Optimization:**
- TinyPNG: https://tinypng.com/ (compress PNG files)
- ImageOptim: https://imageoptim.com/ (Mac)
- GIMP: https://www.gimp.org/ (free image editor)

---

## 🎓 Tips for Thesis Integration

1. **Consistent sizing:** Make all diagrams similar width in thesis
2. **Clear captions:** "Figure 3.1: User Registration Activity Diagram"
3. **Reference in text:** "As shown in Figure 3.1, the registration process..."
4. **Page breaks:** Don't split diagrams across pages
5. **Quality check:** Print one page to verify readability
6. **Backup:** Keep original .puml files for future edits

---

**Good luck with your diagram rendering! If you encounter issues, refer to the troubleshooting section or reach out for help.**

---

**Document Version:** 1.0  
**Last Updated:** November 25, 2025  
**For:** TechConnect Thesis Diagrams
