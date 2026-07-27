(function attachSusanScoring(global) {
  "use strict";

  function hasNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function statusPresentation(publicStatus) {
    const status = String(publicStatus || "");
    if (status.startsWith("Published provisional")) {
      return { label: "Provisional ranking", tone: "warning" };
    }
    if (status.startsWith("Excluded")) {
      return { label: "Not ranked - eligibility review", tone: "danger" };
    }
    return { label: "Validation in progress", tone: "neutral" };
  }

  function componentView(components, name) {
    const component = components && components[name] ? components[name] : null;
    return {
      score: component && hasNumber(component.score) ? component.score : null,
      scoreText: component && hasNumber(component.score) ? component.score.toFixed(1) : "Data pending",
      coverage: component && hasNumber(component.coverage) ? component.coverage : 0,
      coverageText: component && hasNumber(component.coverage)
        ? `${Math.round(component.coverage * 100)}%`
        : "0%",
    };
  }

  function presentProgram(program) {
    const status = statusPresentation(program.publicStatus);
    const components = program.components || {};
    return {
      id: program.programId,
      institution: program.institution,
      country: program.country,
      program: program.program,
      track: program.track || "unclassified",
      eligible: Boolean(program.eligible),
      rankingType: program.rankingType || "provisional-coverage-adjusted",
      routeClassificationStatus: program.routeClassificationStatus || "unknown",
      routeClassificationConfidence: program.routeClassificationConfidence || "low",
      routeClassificationBasis: program.routeClassificationBasis || "",
      publicStatus: program.publicStatus,
      statusLabel: status.label,
      statusTone: status.tone,
      publishedScore: hasNumber(program.publishedScore) ? program.publishedScore : null,
      publishedRank: hasNumber(program.publishedRank) ? program.publishedRank : null,
      publishedRankGroupSize: hasNumber(program.publishedRankGroupSize)
        ? program.publishedRankGroupSize
        : null,
      score: hasNumber(program.publishedScore) ? program.publishedScore : null,
      finalScore: hasNumber(program.finalScore) ? program.finalScore : null,
      scoreText: hasNumber(program.publishedScore)
        ? program.publishedScore.toFixed(1)
        : "Not ranked",
      rank: hasNumber(program.publishedRank) ? program.publishedRank : null,
      strictRank: hasNumber(program.rank) ? program.rank : null,
      rankText: hasNumber(program.publishedRank) ? `#${program.publishedRank}` : "-",
      coverage: hasNumber(program.coverage) ? program.coverage : 0,
      coverageText: hasNumber(program.coverage) ? `${Math.round(program.coverage * 100)}%` : "0%",
      confidence: program.confidence || "insufficient",
      institutionStrengthText: componentView(components, "Institution Strength").scoreText,
      components: Object.fromEntries(
        Object.keys(components).map((name) => [name, componentView(components, name)]),
      ),
      warnings: Array.isArray(program.warnings) ? program.warnings : [],
      exclusionReasons: Array.isArray(program.exclusionReasons) ? program.exclusionReasons : [],
      sources: Array.isArray(program.sources) ? program.sources : [],
    };
  }

  async function load(url) {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Unable to load programme scores: HTTP ${response.status}`);
    }
    const payload = await response.json();
    return {
      meta: {
        methodVersion: payload.methodVersion,
        generatedAt: payload.generatedAt,
        publicLabel: payload.publicLabel,
        rankingType: payload.rankingType || "provisional-coverage-adjusted",
        redditIncludedInAcademicScore: payload.redditIncludedInAcademicScore,
      },
      programs: (payload.programs || []).map(presentProgram),
    };
  }

  function forTrack(programs, track) {
    return programs.filter((program) => program.track === track);
  }

  function publishable(programs) {
    return programs.filter((program) => program.publishedRank !== null);
  }

  global.SusanScoring = Object.freeze({
    load,
    presentProgram,
    forTrack,
    publishable,
  });
})(window);
