package de.pasci.f1manager;

/** F1 Nächstes Rennen (1×1): Flagge und Runde. */
public class Next1Widget extends BaseWidget {
    @Override String kind() { return "next1"; }
    @Override int maxDrivers() { return 0; }
    @Override boolean needTeam() { return false; }
}
