# Microbe Mania: Marine Microbial Ecology Game

An educational solo game about the "Microbial Loop" in marine ecosystems.

## How to Play
1. **Selection**: Choose your microbe's **Morphotype** (shape) and **Metabolism** at the start.
2. **Move**: Use your mouse to guide your microbe through the water column.
3. **Grow**:
   - Consume **Nutrients** to increase your size.
   - Your growth is most efficient when you consume nutrients that match your metabolism:
     - **Photoautotrophs**: Seek out **Sunlight** (yellow stars).
     - **Heterotrophs**: Seek out **DOM** (peach dots).
     - **Chemoautotrophs**: Seek out **Chemicals** (green diamonds).
4. **Divide**: Once you reach 30μm, you will undergo binary fission (division), resetting your size but significantly increasing your score.
5. **Survive**:
   - Avoid **Protists** (large red circles): These are grazers that want to consume you!
   - Avoid **Viruses** (purple spiked particles): These will infect and lyse (burst) your microbe!

## Biological Features
- **Morphotypes**: Choose between **Coccus** (spherical), **Bacillus** (rod-shaped), or **Spirillum** (spiral-shaped).
- **Metabolisms**: Your choice of metabolism determines which nutrient source fuels your growth, reflecting the diversity of marine prokaryotes.

## The Science: The Microbial Loop
In the ocean, not all energy flows directly from phytoplankton to fish. Much of it is "leaked" as dissolved organic matter (DOM).

The **Microbial Loop** is a pathway where:
1. **Bacteria** (you!) consume this DOM and other nutrients.
2. **Protists** (grazers) eat the bacteria.
3. **Viruses** infect bacteria, causing them to burst and release DOM back into the water.

This cycle is crucial for recycling nutrients and supporting the entire marine food web.

## Technical Details
- Built with HTML5 Canvas and Vanilla JavaScript.
- No external dependencies required.
