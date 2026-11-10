package de.pasci.f1manager;

/** F1 Top 3 (3×2): Die drei Führenden einer Saison. */
public class Top3SmallWidget extends BaseWidget {
    @Override String kind() { return "top3"; }
    @Override int maxDrivers() { return 0; }
    @Override boolean needTeam() { return false; }
}
