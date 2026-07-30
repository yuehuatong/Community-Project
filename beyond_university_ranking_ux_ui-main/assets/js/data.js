const DATA_ROOT = new URL("../../data/", import.meta.url);

async function fetchJson(name) {
  const response = await fetch(new URL(name, DATA_ROOT));
  if (!response.ok) {
    throw new Error(`Could not load ${name} (${response.status})`);
  }
  return response.json();
}

function countBy(items, valueFor) {
  return items.reduce((counts, item) => {
    const value = valueFor(item);
    if (value) counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
}

function overlayScoring(programme, view, meta) {
  const previous = programme.scoring || {};
  const components = view.components;
  const institutionStrength = components["Institution Strength"]?.score ?? null;
  const route = view.track === "research"
    ? "Research-oriented (provisional)"
    : view.track === "taught"
      ? "Taught/Professional (provisional)"
      : "Validation in progress";
  programme.programmeType = {
    ...programme.programmeType,
    value: route,
    state: view.track ? "provisional" : "manual-review",
    basis: view.routeClassificationBasis || "Route classification is still being reviewed.",
    confidence: view.routeClassificationConfidence,
    classificationStatus: view.routeClassificationStatus,
  };
  programme.institutionStrength = {
    ...programme.institutionStrength,
    score: institutionStrength,
  };
  programme.scoring = {
    ...previous,
    methodVersion: meta.methodVersion,
    generatedAt: meta.generatedAt,
    publicLabel: meta.publicLabel,
    rankingType: view.rankingType,
    publicStatus: view.publicStatus,
    status: {
      code: view.statusCode,
      label: view.statusLabel,
      tone: view.statusTone,
    },
    strictPublicStatus: view.strictPublicStatus,
    track: view.track,
    routeClassification: {
      status: view.routeClassificationStatus,
      confidence: view.routeClassificationConfidence,
      basis: view.routeClassificationBasis,
    },
    provisionalEligible: view.eligible,
    strictEligible: view.strictEligible,
    provisionalScore: view.score,
    provisionalScoreText: view.scoreText,
    provisionalRank: view.rank,
    provisionalRankText: view.rankText,
    provisionalRankGroupSize: view.publishedRankGroupSize,
    finalScore: view.finalScore,
    scoredWeightCoverage: view.coveragePercent,
    scoredWeightCoverageText: view.coverageText,
    confidence: view.confidence,
    ordinalRank: view.strictRank,
    rankGroupSize: view.strictRankGroupSize,
    components,
    warnings: view.warnings,
    exclusionReasons: view.exclusionReasons,
    criticalWarning: view.warnings.some((warning) => warning.toLocaleLowerCase().includes("critical")),
    sources: view.sources,
  };
}

function runtimeScoringMetadata(previous, meta, programs) {
  const ranked = programs.filter((program) => program.rank !== null);
  const strictRanks = programs.filter((program) => program.strictRank !== null);
  const finalScores = programs.filter((program) => program.finalScore !== null);
  return {
    ...previous,
    file: "program_scores.json",
    methodVersion: meta.methodVersion,
    generatedAt: meta.generatedAt,
    publicLabel: meta.publicLabel,
    rankingType: meta.rankingType,
    redditIncludedInAcademicScore: meta.redditIncludedInAcademicScore,
    programmes: programs.length,
    matchedProgrammes: programs.length,
    institutionStrengthAvailable: programs.filter(
      (program) => program.components["Institution Strength"]?.score !== null,
    ).length,
    provisionalRoutes: programs.filter((program) => program.track !== null).length,
    confirmedRoutes: programs.filter(
      (program) => program.routeClassificationStatus === "manually-confirmed",
    ).length,
    provisionalRanked: ranked.length,
    researchProvisionalRanked: ranked.filter((program) => program.track === "research").length,
    taughtProvisionalRanked: ranked.filter((program) => program.track === "taught").length,
    provisionalExcluded: programs.filter(
      (program) => program.rank === null && program.eligible === false,
    ).length,
    strictEligible: programs.filter((program) => program.strictEligible === true).length,
    finalScoresPublished: finalScores.length,
    ordinalRanksPublished: strictRanks.length,
    criticalWarnings: programs.filter(
      (program) => program.warnings.some(
        (warning) => warning.toLocaleLowerCase().includes("critical"),
      ),
    ).length,
    statusCounts: countBy(programs, (program) => program.statusCode),
    routeStatusCounts: countBy(programs, (program) => program.routeClassificationStatus),
    routeConfidenceCounts: countBy(programs, (program) => program.routeClassificationConfidence),
  };
}

export async function loadData() {
  if (!window.SusanScoring) {
    throw new Error("The scoring adapter could not be loaded.");
  }
  const [metadata, programmePayload, community, validation, scoringSnapshot] = await Promise.all([
    fetchJson("metadata.json"),
    fetchJson("programmes.json"),
    fetchJson("community.json"),
    fetchJson("validation-report.json"),
    window.SusanScoring.load(new URL("program_scores.json", DATA_ROOT)),
  ]);
  const programmes = programmePayload.programmes;
  if (!Array.isArray(programmes) || programmes.length !== 60) {
    throw new Error("The programme dataset did not pass the expected 60-record check.");
  }
  const scoreByIdentity = new Map(
    scoringSnapshot.programs.map((program) => [program.identityKey, program]),
  );
  const matched = [];
  programmes.forEach((programme) => {
    const identity = window.SusanScoring.identityKey(
      programme.institution,
      programme.programme,
      programme.country,
    );
    const scoring = scoreByIdentity.get(identity);
    if (!scoring) return;
    overlayScoring(programme, scoring, scoringSnapshot.meta);
    matched.push(identity);
  });
  if (scoreByIdentity.size !== 60 || matched.length !== 60 || new Set(matched).size !== 60) {
    throw new Error("The scoring snapshot did not reconcile to all 60 stable programme identities.");
  }
  metadata.scoring = runtimeScoringMetadata(
    metadata.scoring,
    scoringSnapshot.meta,
    scoringSnapshot.programs,
  );
  return {
    metadata,
    programmes,
    programmeById: new Map(programmes.map((programme) => [programme.id, programme])),
    community,
    validation,
  };
}
