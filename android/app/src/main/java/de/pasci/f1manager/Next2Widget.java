package de.pasci.f1manager;

/** F1 Nächstes Rennen (2×2): Strecke, Wetter, Runde. */
public class Next2Widget extends BaseWidget {
    @Override String kind() { return "next2"; }
    @Override int maxDrivers() { return 0; }
    @Override boolean needTeam() { return false; }
}
