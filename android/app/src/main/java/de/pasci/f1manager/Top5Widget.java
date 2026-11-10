package de.pasci.f1manager;

/** F1 Top 5 (5×2): Die fünf Führenden. */
public class Top5Widget extends BaseWidget {
    @Override String kind() { return "top5"; }
    @Override int maxDrivers() { return 0; }
    @Override boolean needTeam() { return false; }
}
