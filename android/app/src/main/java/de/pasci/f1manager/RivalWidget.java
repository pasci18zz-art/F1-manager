package de.pasci.f1manager;

/** F1 Rivalen (3×1): Zwei Fahrer im Vergleich. */
public class RivalWidget extends BaseWidget {
    @Override String kind() { return "rival"; }
    @Override int maxDrivers() { return 2; }
    @Override boolean needTeam() { return false; }
}
