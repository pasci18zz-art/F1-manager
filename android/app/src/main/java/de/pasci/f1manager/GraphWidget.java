package de.pasci.f1manager;

/** F1 Punkteverlauf (4×3): Verlauf der Top 5. */
public class GraphWidget extends BaseWidget {
    @Override String kind() { return "graph"; }
    @Override int maxDrivers() { return 0; }
    @Override boolean needTeam() { return false; }
}
