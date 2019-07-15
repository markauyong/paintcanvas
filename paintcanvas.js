//------------------------------------------------------------------------------
// File: paintcanvas.js
// Author: Mark Au-Yong
// Desc: A simple browser based paint program example using HTML5 canvas elements and
//       vanilla javascript.
// Usage: See the accompanying example.html for usage.
//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
// paintCanvas class
//------------------------------------------------------------------------------
class paintCanvas {
  constructor(canvasID, containerID) {
    this.aspectRatio = 0;

    this.containerID = containerID;
    this.canvasID = canvasID;

    this.mouseDown = false;
    this.clicked = false;

    this.mouseDownPos = { x:0, y:0 }

    this.width = 1024;
    this.height = 768;

    this.backgroundColour ='white';

    this.menuFrame = new menuFrame(this);

    let canvas = document.getElementById(this.canvasID);
    canvas.addEventListener("click", this);
    canvas.addEventListener("mousemove", this);
    canvas.addEventListener("mousedown", this);
    canvas.addEventListener("mouseup", this);
    canvas.addEventListener("mouseleave", this);

    window.addEventListener("load", this);
    window.addEventListener("resize", this);

    this.setSize(this.width, this.height);
  }

//------------------------------------------------------------------------------
  handleEvent(event) {
    const e = event || window.event;

    switch(e.type) {
      case "click":
        this.clicked = true;
        this.update(e);
        this.clicked = false;
        break;
      case "mousemove":
        if (!this.mouseDown) { return; }
        this.update(e);
        break;
      case "mousedown":
        if (!this.mouseDown) {
          this.mouseDownPos = this.absoluteMousePos(e);
        }
        this.mouseDown = true;
        break;
      case "mouseup":
        this.mouseDown = false;
        break;
      case "mouseleave":
        this.mouseDown = false;
        break;
      case "resize":
        const c = document.getElementById(this.canvasID);
        const w = document.getElementById(this.containerID);
        const height = Math.floor((w.clientWidth) * this.aspectRatio);
        c.style.maxHeight = height.toString() + 'px';
        break;
      // The palette image doesn't always load in time so redraw
      // the menu once the page is fully loaded
      case "load":
        console.log("LOADED");
        const c1 = document.getElementById(this.canvasID);
        const ctx = c1.getContext("2d");
        this.menuFrame.update(c1, ctx, 0, 0);
      default:
    }
  }

//------------------------------------------------------------------------------
// Returns the mouse position expressed in co-ordinates relative to the
// instance's height and width properties. This allows for absolute
// co-ordinate references regardless of the actual size of the canvas element.
  absoluteMousePos(e) {
    let absPos = { x:0, y:0 }

    const c = document.getElementById(this.canvasID);
    const xRatio = c.width / c.clientWidth;
    const yRatio = c.height / c.clientHeight;
    absPos.x = e.offsetX * xRatio;
    absPos.y = e.offsetY * yRatio;

    return absPos;
  }

//------------------------------------------------------------------------------
// Updates the entire canvas. Will draw the currently selected menu brush
// to the drawing area if the mouse position is inbounds.
  update(e) {
    const c = document.getElementById(this.canvasID);
    const ctx = c.getContext("2d");
    const pos = this.absoluteMousePos(e);

    if (pos.x < c.width - this.menuFrame.brushBufferWidth) {
      ctx.fillStyle = this.menuFrame.brushColour;
      ctx.beginPath();
      this.menuFrame.drawBrush(ctx, pos.x, pos.y, this.menuFrame.selectedBrushSize());
      ctx.fill();
    }

    this.menuFrame.update(c, ctx, pos.x, pos.y);
  }

//------------------------------------------------------------------------------
// Changes the size of the canvas and recalculate the aspect ratio.
  setSize(width, height) {
    let c = document.getElementById(this.canvasID);
    const w = document.getElementById(this.containerID);

    c.width = width;
    c.height = height;

    this.aspectRatio = c.height / c.width;
    const maxHeight = Math.floor((w.clientWidth) * this.aspectRatio);

    c.style.maxHeight = maxHeight.toString() + 'px';

    this.width = width;
    this.height = height;

    this.updateChanges(c);
  }

//------------------------------------------------------------------------------
// Changes the canvas background colour.
  setBackground(colour) {
    this.backgroundColour = colour;

    let c = document.getElementById(this.canvasID);
    this.updateChanges(c);
  }

//------------------------------------------------------------------------------
// Repaints the canvas background and refreshes the menu frame. This is necessary
// after changing the canvas size or background colour to avoid unpredictable
// behaviour.
  updateChanges(c) {
    let ctx = c.getContext("2d");

    ctx.fillStyle = this.backgroundColour;
    ctx.fillRect(0, 0, c.width, c.height);

    let x = c.width / c.clientWidth;
    let y = c.height / c.clientHeight;

    this.menuFrame.update(c, ctx, 0, 0);
  }
}

//------------------------------------------------------------------------------
// menuFrame class
//------------------------------------------------------------------------------
class menuFrame {
  constructor(parent) {
    this.parent = parent;

    this.frameColour = 'rgb(90,90,90)';
    this.frameBorderWidth = 2;
    this.width = 310;
    this.brushBufferWidth = this.width - 10;

    this.brushColour = 'black';
    this.brushSizeIndex = 3;
    this.shapeType = menuFrame.ShapeEnum.circle;
    this.scaleFactor = 10;

    this.palette = new Image();
    this.palette.src = menuFrame.paletteImg;

    // Brush size panel selection config values
    this.sz = {
      x: 295,
      y: 50,
      size: 90,
      count: 6,
      columns: 3,
      hSpacing: 5,
      vSpacing: 4,
      boxColour: 'rgb(150,150,150)',
      shapeColour: 'black',
      borderWidth: 2,
      selectedPadding: 5,
      selectedColour: 'rgb(225,225,225)',
      selectedBorderWidth: 4,
      text: 'Brush Size',
      textColour: 'white',
      textFont: '24px Calibri',
      textXOffset: 5,
      textYOffset: 10,
    }

    // Brush shape selection panel config values
    this.sh = {
      x: 295,
      y: this.sz.y + 250,
      size: 90,
      count: 3,
      columns: 3,
      hSpacing: 5,
      vSpacing: 4,
      boxColour: 'rgb(150,150,150)',
      shapeColour: 'black',
      shapeSizeIndex: 3,
      borderWidth: 2,
      selectedPadding: 5,
      selectedColour: 'rgb(225,225,225)',
      selectedBorderWidth: 4,
      text: 'Brush Shape',
      textColour: 'white',
      textFont: '24px Calibri',
      textXOffset: 5,
      textYOffset: 10,
    }

    // Brush selected colour and palette values
    this.sw = {
      x: 255,
      y: this.sh.y + 160,
      colourBoxX: 40,
      colourBoxWidth: 30,
      colourBoxHeight: 30,
      colourBoxBorderWidth: 1,
      paletteWidth: 240,
      paletteHeight: 30,
      paletteBorderWidth: 2,
      text: "Brush Colour",
      textFont: '24px Calibri',
      textColour: "white",
      textOffsetX: 40,
      textOffsetY: 10,
    }

    // Reset button values
    this.rb = {
      x: 200,
      y: this.sw.y + 70,
      width: 90,
      height: 50,
      radius: 10, // rounded corner radius
      borderWidth: 4,
      colour: 'rgb(110,110,110)', // button fill colour
      text: 'Clear',
      textColour: 'white',
      textFont: '20px Calibri',
      textXOffset: 24,
      textYOffset: 31,
    }
  }

//------------------------------------------------------------------------------
// Updates menu selections. Parameters (x, y) are current mouse co-ordinates.
  update(c, ctx, x, y) {
    const downPos = this.parent.mouseDownPos;

    // Select brush colour if mouse is clicked and released inside the palette area
    if (isInside(x, y, c.width - this.sw.x, this.sw.y, this.sw.paletteWidth - 1, this.sw.paletteHeight) &&
        isInside(downPos.x, downPos.y, c.width - this.sw.x, this.sw.y, this.sw.paletteWidth - 1, this.sw.paletteHeight))
    {
       const px = ctx.getImageData(x, y, 1, 1).data;
       this.brushColour = 'rgb(' + px[0] + ',' + px[1] + ',' + px[2] + ')';
    }

    if (this.parent.clicked) {

      // Select size if mouse is clicked and released inside size selection box
      for (let i = 0; i < this.sz.count; i++) {
        //let sb = this.calcSizeBoxPosition(i, c);
        const boxPos = this.boxPosition(i, c, this.sz)
        if (isInside(x, y, boxPos.x, boxPos.y, this.sz.size, this.sz.size) &&
            isInside(downPos.x, downPos.y, boxPos.x, boxPos.y, this.sz.size, this.sz.size))
        {
          this.brushSizeIndex = i;
        }
      }

      // Select shape if mouse is clicked and released inside shape selection box
      for (let i = 0; i < this.sh.count; i++) {
        const boxPos = this.boxPosition(i, c, this.sh);
        if (isInside(x, y, boxPos.x, boxPos.y, this.sh.size, this.sh.size) &&
            isInside(downPos.x, downPos.y, boxPos.x, boxPos.y, this.sh.size, this.sh.size))
        {
          this.shapeType = i;
        }
      }

      // Clear the canvas if mouse is clicked and released inside the reset button
      if (isInside(x, y, c.width - this.rb.x, this.rb.y, this.rb.width, this.rb.height) &&
          isInside(downPos.x, downPos.y, c.width - this.rb.x, this.rb.y, this.rb.width, this.rb.height))
      {
        ctx.clearRect(0, 0, c.width, c.height);
        this.parent.setBackground(this.parent.backgroundColour);
      }
    }

    // Draw the menu background frame
    drawBox(ctx, c.width - this.width, 0, this.width, c.height, this.frameBorderWidth, this.frameColour);

    this.drawSizeBoxes(ctx, c);
    this.drawShapeBoxes(ctx, c);
    this.drawSwatch(ctx, c);
    this.drawResetButton(ctx, c);
  }

//------------------------------------------------------------------------------
// Draws the brush size selection panel
  drawSizeBoxes(ctx, c) {
    // Draw the panel text offset above and left of the middle box column
    const panelPos = this.boxPosition(1, c, this.sz);
    ctx.font = this.sz.textFont;
    ctx.fillStyle = this.sz.textColour;
    ctx.fillText(this.sz.text, panelPos.x - this.sz.textXOffset, panelPos.y - this.sz.textYOffset);

    for (let i = 0; i < this.sz.count; i++) {
      const pos = this.boxPosition(i, c, this.sz);
      drawBox(ctx, pos.x, pos.y, this.sz.size, this.sz.size, this.sz.borderWidth, this.sz.boxColour);

      // Draw selection highlight for currently selected brush size
      if (this.brushSizeIndex === i) {
        drawBox(
          ctx,
          pos.x + this.sz.selectedPadding,
          pos.y + this.sz.selectedPadding,
          this.sz.size - (this.sz.selectedPadding * 2.0),
          this.sz.size - (this.sz.selectedPadding * 2.0),
          this.sz.selectedBorderWidth,
          this.sz.selectedColour
        );
      }

      // Draw scaled shape at center of box
      const centerX = pos.x + (this.sz.size / 2.0);
      const centerY = pos.y + (this.sz.size / 2.0);
      ctx.beginPath();
      ctx.fillStyle = this.sz.shapeColour;
      this.drawBrush(ctx, centerX, centerY, this.scaledBrushSize(i));
      ctx.fill();
    }
  }

//------------------------------------------------------------------------------
// Draws the brush shape selection panel.
  drawShapeBoxes(ctx, c) {
    // Draw the panel text offset above and left of the middle box column
    const panelPos = this.boxPosition(1, c, this.sh);
    ctx.font = this.sh.textFont;
    ctx.fillStyle = this.sh.textColour;
    ctx.fillText(this.sh.text, panelPos.x - this.sh.textXOffset, panelPos.y - this.sh.textYOffset);

    for (let i = 0; i < this.sh.count; i++) {
      const pos = this.boxPosition(i, c, this.sh);
      drawBox(ctx, pos.x, pos.y, this.sh.size, this.sh.size, this.sh.borderWidth, this.sh.boxColour);

      // Draw selection highlight for currently selected brush shape
      if (this.shapeType === i) {
        drawBox(
          ctx,
          pos.x + this.sh.selectedPadding,
          pos.y + this.sh.selectedPadding,
          this.sh.size - (this.sh.selectedPadding * 2.0),
          this.sh.size - (this.sh.selectedPadding * 2.0),
          this.sh.selectedBorderWidth,
          this.sh.selectedColour
        );
      }

      const centerX = pos.x + (this.sh.size / 2.0);
      const centerY = pos.y + (this.sh.size / 2.0);
      ctx.beginPath();
      ctx.fillStyle = this.sh.shapeColour;
      switch(i) {
        case 0:
          drawCircle(ctx, centerX, centerY, this.scaledBrushSize(this.sh.shapeSizeIndex));
          break;
        case 1:
          drawSquare(ctx, centerX, centerY, this.scaledBrushSize(this.sh.shapeSizeIndex));
          break;
        default:
          drawStar(ctx, centerX, centerY, this.scaledBrushSize(this.sh.shapeSizeIndex));
      }

      ctx.fill();
    }
  }

//------------------------------------------------------------------------------
// Draws the selected brush colour swatch and palette panel
  drawSwatch(ctx, c) {
    ctx.font = this.sw.textFont;
    ctx.fillStyle = this.sw.textColour;
    ctx.fillText(this.sw.text, (c.width - this.sw.x) + this.sw.textOffsetX, this.sw.y - this.sw.textOffsetY);

    // Draw the currently selected colour box
    drawBox(
      ctx,
      c.width - (this.sw.x + this.sw.colourBoxX),
      this.sw.y,
      this.sw.colourBoxWidth,
      this.sw.colourBoxHeight,
      this.sw.colourBoxBorderWidth,
      this.brushColour
    );

    // Draw the colour palette
    drawBox(
      ctx,
      c.width - this.sw.x,
      this.sw.y,
      this.sw.paletteWidth,
      this.sw.paletteHeight,
      this.sw.paletteBorderWidth,
      this.sw.textColour
    );
    ctx.drawImage(this.palette, c.width - this.sw.x, this.sw.y, this.sw.paletteWidth, this.sw.paletteHeight);
  }

//------------------------------------------------------------------------------
// Draws the clear canvas button
  drawResetButton(ctx, c) {
    const radius = this.rb.radius;
    const width = this.rb.width;
    const height = this.rb.height;
    const startX = (c.width - this.rb.x) + radius;
    const startY = this.rb.y;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(startX + width - (2.0 * radius), startY);
    ctx.arcTo(startX + width - radius, startY, startX + width - radius, startY + radius, radius);
    ctx.lineTo(startX + width - radius, startY + height - radius);
    ctx.arcTo(startX + width - radius, startY + height, startX + width - (2.0 * radius), startY + height, radius);
    ctx.lineTo(startX, startY + height);
    ctx.arcTo(startX - radius, startY + height, startX - radius, startY + (height - radius), radius);
    ctx.lineTo(startX - radius, startY + radius);
    ctx.arcTo(startX - radius, startY, startX, startY, radius);
    ctx.lineWidth = this.rb.borderWidth;
    ctx.stroke();
    ctx.fillStyle = this.rb.colour;
    ctx.fill();

    ctx.font = this.rb.textFont;
    ctx.fillStyle = this.rb.textColour;
    ctx.fillText(this.rb.text, (c.width - this.rb.x) + this.rb.textXOffset, this.rb.y + this.rb.textYOffset);
  }


//------------------------------------------------------------------------------
// Returns the top left co-ordinate position of the selection box at (idx).
  boxPosition(idx, c, panel) {
    let pos = { x:0, y:0 }

    const vOffset = Math.floor(idx / panel.columns);
    const x = (c.width - panel.x) + ((idx % panel.columns) * (panel.size + panel.hSpacing));
    const y = panel.y + (panel.size * vOffset) + (vOffset * panel.vSpacing);

    pos.x = x;
    pos.y = y;

    return pos;
  }

//------------------------------------------------------------------------------
// Returns the scaled pixel size of brush index (idx). Returns the smallest size if
// (idx) is out of range.
  scaledBrushSize(idx) {
    if (idx < 0 || idx >= this.sz.count) {
      return this.scaleFactor;
    }

    return (idx + 1) * this.scaleFactor;
  }
//------------------------------------------------------------------------------
// Returns the scaled pixel size of the currently selected brush
  selectedBrushSize() {
    return this.scaledBrushSize(this.brushSizeIndex);
  }

//------------------------------------------------------------------------------
// Draw the currently selected brush shape to a context
  drawBrush(ctx, x, y, size) {
    switch(this.shapeType) {
      case menuFrame.ShapeEnum.circle:
        drawCircle(ctx, x, y, size);
        break;
      case menuFrame.ShapeEnum.square:
        drawSquare(ctx, x, y, size);
        break;
      case menuFrame.ShapeEnum.star:
        drawStar(ctx, x, y, size);
        break;
      default:
    }
  }
}

//------------------------------------------------------------------------------
// Helper functions
//------------------------------------------------------------------------------

//------------------------------------------------------------------------------
// Draws a box to context (ctx) with a top left position of (x, y) and size
// (width, height). Box colour is (fillColour) with a black border of (borderWidth)
function drawBox(ctx, x, y, width, height, borderWidth, fillColour) {
  ctx.lineWidth = borderWidth;
  ctx.fillStyle = fillColour;
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  if (borderWidth > 0) {
    ctx.stroke();
  }
  ctx.fill();
}

//------------------------------------------------------------------------------
// Draw a circle to context (ctx) centered at position (x, y) with a pixel diameter
// of (size).
function drawCircle(ctx, x, y, size) {
  ctx.arc(x, y, (size / 2.0), 0, 2.0*Math.PI);
}

//------------------------------------------------------------------------------
// Draw as square to context (ctx) centered at position (x, y) with a pixel diameter
// of (size).
function drawSquare(ctx, x, y, size) {
  ctx.rect(x - (size / 2.0), y - (size / 2.0), size, size);
}

//------------------------------------------------------------------------------
// Draw a five pointed star to context (ctx) centered at position (x, y) with
// the pixel distance between points equal to (size).
function drawStar(ctx, x, y, size) {
  const degree2Rad18 = (18.0 / 180.0) * Math.PI;
  const degree2Rad36= (36.0 / 180.0) * Math.PI;
  const sinVal18 = Math.sin(degree2Rad18) * size;
  const cosVal18 = Math.cos(degree2Rad18) * size;
  const sinVal36 = Math.sin(degree2Rad36) * size;
  const cosVal36 = Math.cos(degree2Rad36) * size;

  const p1x = x;
  const p1y = y - (cosVal18 / 2.0)
  const p2x = p1x - sinVal18;
  const p2y = p1y + cosVal18;
  const p3x = p2x + cosVal36;
  const p3y = p2y - sinVal36;
  const p4x = p3x - size;
  const p4y = p3y;
  const p5x = p4x + cosVal36;
  const p5y = p4y + sinVal36;

  ctx.moveTo(p1x, p1y);
  ctx.lineTo(p2x, p2y);
  ctx.lineTo(p3x, p3y);
  ctx.lineTo(p4x, p4y);
  ctx.lineTo(p5x, p5y);
  ctx.lineTo(p1x, p1y);
}

//------------------------------------------------------------------------------
// Calculate if co-ordinate position (mx, my) is inside an area with top left
// co-ordinates (x, y) and of size (width, height)
function isInside(mx, my, x, y, width, height)
{
  return ((mx >= x && mx <= x + width) && (my >= y && my <= y + height));
}

//------------------------------------------------------------------------------
//menuFrame class properties
//------------------------------------------------------------------------------
menuFrame.ShapeEnum = {"circle":0, "square":1, "star":2}

// The palette image. Using embedded base64 instead of an image file bypasses
// possible cross-origin problems and removes the need for an external asset.
menuFrame.paletteImg = "data:image/jpeg;base64,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////////////////A+gAAAAA/////////////////////////////wPoAAAAAP////////////////////////////8D6AAAAAD/////////////////////////////A+gAADhCSU0ECAAAAAAAEAAAAAEAAAJAAAACQAAAAAA4QklNBB4AAAAAAAQAAAAAOEJJTQQaAAAAAANBAAAABgAAAAAAAAAAAAAAHgAAAPAAAAAGAHMAdwBhAHQAYwBoAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAADwAAAAHgAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAABAAAAABAAAAAAAAbnVsbAAAAAIAAAAGYm91bmRzT2JqYwAAAAEAAAAAAABSY3QxAAAABAAAAABUb3AgbG9uZwAAAAAAAAAATGVmdGxvbmcAAAAAAAAAAEJ0b21sb25nAAAAHgAAAABSZ2h0bG9uZwAAAPAAAAAGc2xpY2VzVmxMcwAAAAFPYmpjAAAAAQAAAAAABXNsaWNlAAAAEgAAAAdzbGljZUlEbG9uZwAAAAAAAAAHZ3JvdXBJRGxvbmcAAAAAAAAABm9yaWdpbmVudW0AAAAMRVNsaWNlT3JpZ2luAAAADWF1dG9HZW5lcmF0ZWQAAAAAVHlwZWVudW0AAAAKRVNsaWNlVHlwZQAAAABJbWcgAAAABmJvdW5kc09iamMAAAABAAAAAAAAUmN0MQAAAAQAAAAAVG9wIGxvbmcAAAAAAAAAAExlZnRsb25nAAAAAAAAAABCdG9tbG9uZwAAAB4AAAAAUmdodGxvbmcAAADwAAAAA3VybFRFWFQAAAABAAAAAAAAbnVsbFRFWFQAAAABAAAAAAAATXNnZVRFWFQAAAABAAAAAAAGYWx0VGFnVEVYVAAAAAEAAAAAAA5jZWxsVGV4dElzSFRNTGJvb2wBAAAACGNlbGxUZXh0VEVYVAAAAAEAAAAAAAlob3J6QWxpZ25lbnVtAAAAD0VTbGljZUhvcnpBbGlnbgAAAAdkZWZhdWx0AAAACXZlcnRBbGlnbmVudW0AAAAPRVNsaWNlVmVydEFsaWduAAAAB2RlZmF1bHQAAAALYmdDb2xvclR5cGVlbnVtAAAAEUVTbGljZUJHQ29sb3JUeXBlAAAAAE5vbmUAAAAJdG9wT3V0c2V0bG9uZwAAAAAAAAAKbGVmdE91dHNldGxvbmcAAAAAAAAADGJvdHRvbU91dHNldGxvbmcAAAAAAAAAC3JpZ2h0T3V0c2V0bG9uZwAAAAAAOEJJTQQoAAAAAAAMAAAAAj/wAAAAAAAAOEJJTQQUAAAAAAAEAAAABThCSU0EDAAAAAAEigAAAAEAAACgAAAAFAAAAeAAACWAAAAEbgAYAAH/2P/tAAxBZG9iZV9DTQAB/+4ADkFkb2JlAGSAAAAAAf/bAIQADAgICAkIDAkJDBELCgsRFQ8MDA8VGBMTFRMTGBEMDAwMDAwRDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAENCwsNDg0QDg4QFA4ODhQUDg4ODhQRDAwMDAwREQwMDAwMDBEMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwM/8AAEQgAFACgAwEiAAIRAQMRAf/dAAQACv/EAT8AAAEFAQEBAQEBAAAAAAAAAAMAAQIEBQYHCAkKCwEAAQUBAQEBAQEAAAAAAAAAAQACAwQFBgcICQoLEAABBAEDAgQCBQcGCAUDDDMBAAIRAwQhEjEFQVFhEyJxgTIGFJGhsUIjJBVSwWIzNHKC0UMHJZJT8OHxY3M1FqKygyZEk1RkRcKjdDYX0lXiZfKzhMPTdePzRieUpIW0lcTU5PSltcXV5fVWZnaGlqa2xtbm9jdHV2d3h5ent8fX5/cRAAICAQIEBAMEBQYHBwYFNQEAAhEDITESBEFRYXEiEwUygZEUobFCI8FS0fAzJGLhcoKSQ1MVY3M08SUGFqKygwcmNcLSRJNUoxdkRVU2dGXi8rOEw9N14/NGlKSFtJXE1OT0pbXF1eX1VmZ2hpamtsbW5vYnN0dXZ3eHl6e3x//aAAwDAQACEQMRAD8A6yrrhd+crlXVN3deaYXWCGiXStbH64BGqxsvMZoXWru5uVwRJoh9AqzN3dEsydo5XHY/1gaI1CsXfWNhHIVL/SHM8YjwH7XOzY4DYu9b1Hb3VS3rJb3XNZHXmmdQsrM6zIgOhaXL58s6sU5HNZpYwSBdPYO+sIDoLwm/5xt/fC4H9oieVNvUh4rUwUfmcuXOc10iA97/AM4m/vpH6xNj6a4ZvUx4hSd1Ru3stPDhwkasR5znL2D2LvrIOzwgP+srh+euJu6iD3VK3qB1h0KU4MPQtvBzXMGuKN+T3j/rRYPz1Jn1nefz15vZ1F3d5+9SZ1Mj89Ryw4+js8tc6sU+n1/WNx/OVivr5P5y8vb1Zw4cUVvV7uzyPmq88Me7s8vyeKVcUgH089dP7yY9eP7y80/a9/8ApD96b9s3d3n71Ty4iNpN3/R/L/vj7H0r9vn95dJ0271+n493PqVtd94leI/th/8ApD96BZ/jH+uOE92Jh9R9PFxz6dDPRodtY321t3Poc921v77lBi4hM2ejQ+KctixYoGBBJlR/xX//0OCo+2fmcK7V+0FzSSz8v+A6uX/Cewr/AGl2RLP2n3XFpKqd/wDJtHJ9Xqrf2iqln26fdysBJW8P0/wXO5j6f4Tufracfa1hJK7i+rWP+A9APtic/bIXPJK9j/wlvX9B2bPtiq2fa/kqCSk/xmxj/wABM71J90ypt9fsqySUv8JvYt+v+A32+uit9dZaSgl/hOlh/wAN1f1hMftCy0lVyf4TY/8ADHS/TqhfPrPnncZUElHj+YtXnvkj83zfpP8A/9k4QklNBCEAAAAAAFUAAAABAQAAAA8AQQBkAG8AYgBlACAAUABoAG8AdABvAHMAaABvAHAAAAATAEEAZABvAGIAZQAgAFAAaABvAHQAbwBzAGgAbwBwACAAQwBTADYAAAABADhCSU0EBgAAAAAABwAIAQEAAQEA/+EO1mh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8APD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS4zLWMwMTEgNjYuMTQ1NjYxLCAyMDEyLzAyLzA2LTE0OjU2OjI3ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdEV2dD0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlRXZlbnQjIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ1M1IFdpbmRvd3MiIHhtcDpDcmVhdGVEYXRlPSIyMDE4LTEwLTIxVDIyOjEwOjI1KzA5OjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDE4LTEwLTIyVDE0OjAxOjUyKzA5OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAxOC0xMC0yMlQxNDowMTo1MiswOTowMCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo0RENGMkM5N0I3RDVFODExQTJDREIyMTg1RTRDMTRFRCIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDowRDA2OTFBQzMyRDVFODExQTg2QUMzRDZCNUE4RjU1NyIgeG1wTU06T3JpZ2luYWxEb2N1bWVudElEPSJ4bXAuZGlkOjBEMDY5MUFDMzJENUU4MTFBODZBQzNENkI1QThGNTU3IiBkYzpmb3JtYXQ9ImltYWdlL2pwZWciIHBob3Rvc2hvcDpMZWdhY3lJUFRDRGlnZXN0PSIwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMSIgcGhvdG9zaG9wOkNvbG9yTW9kZT0iMyIgcGhvdG9zaG9wOklDQ1Byb2ZpbGU9InNSR0IgSUVDNjE5NjYtMi4xIj4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDowRDA2OTFBQzMyRDVFODExQTg2QUMzRDZCNUE4RjU1NyIgc3RFdnQ6d2hlbj0iMjAxOC0xMC0yMVQyMjoxMDoyNSswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDowRTA2OTFBQzMyRDVFODExQTg2QUMzRDZCNUE4RjU1NyIgc3RFdnQ6d2hlbj0iMjAxOC0xMC0yMVQyMjoxMDoyNSswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENTNSBXaW5kb3dzIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo0RENGMkM5N0I3RDVFODExQTJDREIyMTg1RTRDMTRFRCIgc3RFdnQ6d2hlbj0iMjAxOC0xMC0yMlQxNDowMTo1MiswOTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDw/eHBhY2tldCBlbmQ9InciPz7/4gxYSUNDX1BST0ZJTEUAAQEAAAxITGlubwIQAABtbnRyUkdCIFhZWiAHzgACAAkABgAxAABhY3NwTVNGVAAAAABJRUMgc1JHQgAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLUhQICAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABFjcHJ0AAABUAAAADNkZXNjAAABhAAAAGx3dHB0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"
