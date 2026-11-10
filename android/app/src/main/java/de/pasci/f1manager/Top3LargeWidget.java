package de.pasci.f1manager;

/** F1 Podium (4×2): Podium, Vorsprung und nächstes Rennen. */
public class Top3LargeWidget extends BaseWidget {
    @Override String kind() { return "podium"; }
    @Override int maxDrivers() { return 0; }
    @Override boolean needTeam() { return false; }
}
