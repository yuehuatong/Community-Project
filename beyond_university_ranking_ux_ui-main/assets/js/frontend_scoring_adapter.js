(function attachSusanScoring(global) {
  "use strict";

  function hasNumber(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  function optionalBoolean(value) {
    return typeof value === "boolean" ? value : null;
  }

  function uniqueText(values) {
    return [...new Set((Array.isArray(values) ? values : []).filter(
      (value) => typeof value === "string" && value.trim(),
    ))];
  }

  function identityPart(value) {
    return String(value || "").trim().toLocaleLowerCase().replace(/\s+/g, " ");
  }

  function identityKey(institution, program, country) {
    return [
      identityPart(institution),
      identityPart(program),
      identityPart(country),
    ].join("|");
  }

  function statusPresentation(publicStatus) {
    const status = String(publicStatus || "");
    if (status.startsWith("Published provisional")) {
      return { code: "provisional-ranking", label: "Provisional ranking", tone: "manual-review" };
    }
    if (status.startsWith("Excluded")) {
      return { code: "eligibility-excluded", label: "Not ranked — eligibility review", tone: "unverified" };
    }
    return { code: "validation-in-progress", label: "Validation in progress", tone: "info" };
  }

  function componentView(components, name) {
    const component = components && components[name] ? components[name] : null;
    return {
      score: component && hasNumber(component.score) ? component.score : null,
      scoreText: component && hasNumber(component.score) ? component.score.toFixed(1) : "Data pending",
      weightPercent: component && hasNumber(component.weight) ? component.weight * 100 : null,
      coverage: component && hasNumber(component.coverage) ? component.coverage : null,
      coveragePercent: component && hasNumber(component.coverage) ? component.coverage * 100 : null,
      availableWeight: component && hasNumber(component.availableWeight)
        ? component.availableWeight
        : null,
      coverageText: component && hasNumber(component.coverage)
        ? `${Math.round(component.coverage * 100)}%`
        : "Data pending",
    };
  }

  function presentProgram(program) {
    const status = statusPresentation(program.publicStatus);
    const components = program.components || {};
    return {
      sourceRecordId: hasNumber(program.programId) ? program.programId : null,
      identityKey: identityKey(program.institution, program.program, program.country),
      institution: program.institution,
      country: program.country,
      program: program.program,
      track: ["research", "taught"].includes(program.track) ? program.track : null,
      eligible: optionalBoolean(program.eligible),
      strictEligible: optionalBoolean(program.strictEligible),
      rankingType: program.rankingType || "provisional-coverage-adjusted",
      routeClassificationStatus: program.routeClassificationStatus || null,
      routeClassificationConfidence: program.routeClassificationConfidence || null,
      routeClassificationBasis: program.routeClassificationBasis || null,
      publicStatus: program.publicStatus,
      strictPublicStatus: program.strictPublicStatus || null,
      statusCode: status.code,
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
      strictRankGroupSize: hasNumber(program.rankGroupSize) ? program.rankGroupSize : null,
      rankText: hasNumber(program.publishedRank) ? `#${program.publishedRank}` : "Not published",
      coverage: hasNumber(program.coverage) ? program.coverage : null,
      coveragePercent: hasNumber(program.coverage) ? program.coverage * 100 : null,
      coverageText: hasNumber(program.coverage) ? `${Math.round(program.coverage * 100)}%` : "Data pending",
      confidence: program.confidence || null,
      institutionStrengthText: componentView(components, "Institution Strength").scoreText,
      components: Object.fromEntries(
        Object.keys(components).map((name) => [name, componentView(components, name)]),
      ),
      warnings: uniqueText(program.warnings),
      exclusionReasons: uniqueText(program.exclusionReasons),
      sources: uniqueText(program.sources),
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
    identityKey,
    forTrack,
    publishable,
  });
})(window);
