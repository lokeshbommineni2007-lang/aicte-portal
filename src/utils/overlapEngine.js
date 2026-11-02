/**
 * Jaro-Winkler String Distance Metric
 * Calculates similarity between two strings (0.0 to 1.0)
 */
export function jaroWinklerSimilarity(s1, s2) {
  const str1 = (s1 || "").toLowerCase().trim();
  const str2 = (s2 || "").toLowerCase().trim();

  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;

  const matchDistance = Math.floor(Math.max(str1.length, str2.length) / 2) - 1;
  const str1Matches = new Array(str1.length).fill(false);
  const str2Matches = new Array(str2.length).fill(false);

  let matches = 0;
  for (let i = 0; i < str1.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, str2.length);

    for (let j = start; j < end; j++) {
      if (!str2Matches[j] && str1[i] === str2[j]) {
        str1Matches[i] = true;
        str2Matches[j] = true;
        matches++;
        break;
      }
    }
  }

  if (matches === 0) return 0.0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < str1.length; i++) {
    if (str1Matches[i]) {
      while (!str2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }
  }

  const jaro =
    (matches / str1.length +
      matches / str2.length +
      (matches - transpositions / 2) / matches) /
    3.0;

  // Winkler prefix adjustment
  let prefix = 0;
  for (let i = 0; i < Math.min(4, Math.min(str1.length, str2.length)); i++) {
    if (str1[i] === str2[i]) prefix++;
    else break;
  }

  return Math.min(1.0, jaro + prefix * 0.1 * (1.0 - jaro));
}

/**
 * Token-based Semantic Keyword Overlap
 */
export function calculateSemanticOverlap(text1, text2) {
  const stopWords = new Set([
    "the", "is", "at", "which", "on", "a", "an", "and", "or", "to", "in", "of",
    "for", "by", "with", "this", "that", "college", "institute", "student", "has"
  ]);

  const tokenize = (text) =>
    (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !stopWords.has(w));

  const words1 = new Set(tokenize(text1));
  const words2 = new Set(tokenize(text2));

  if (words1.size === 0 || words2.size === 0) return 0.0;

  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }

  // Jaccard similarity
  const union = new Set([...words1, ...words2]).size;
  return intersection / union;
}

/**
 * 4-Layer Overlap Detection Engine
 * Evaluates an incoming complaint against all active cases.
 */
export function runOverlapDetection(newComplaint, activeCases, institutions) {
  const findings = [];

  for (const existingCase of activeCases) {
    // Skip if comparing same case ID
    if (newComplaint.id && newComplaint.id === existingCase.id) continue;
    // Skip already disposed cases for active coordination
    if (existingCase.status === "Disposed") continue;

    let matchConfidence = 0.0;
    let detectionMethod = "";
    let reason = "";

    // LAYER 1: Exact AICTE PID Match
    if (
      newComplaint.aictePid &&
      existingCase.aictePid &&
      newComplaint.aictePid.trim().toLowerCase() === existingCase.aictePid.trim().toLowerCase()
    ) {
      matchConfidence = 1.0;
      detectionMethod = "Layer 1: Exact AICTE Permanent ID Match";
      reason = `Both complaints target the identical AICTE Permanent ID (${existingCase.aictePid}).`;
    } else {
      // LAYER 2: Fuzzy Institution Matching (Direct Name + Known Aliases)
      const targetInst = institutions.find(
        (inst) => inst.pid === existingCase.aictePid || inst.name === existingCase.institutionName
      );

      let highestNameSim = jaroWinklerSimilarity(
        newComplaint.institutionName,
        existingCase.institutionName
      );

      if (targetInst && targetInst.aliases) {
        for (const alias of targetInst.aliases) {
          const sim = jaroWinklerSimilarity(newComplaint.institutionName, alias);
          if (sim > highestNameSim) highestNameSim = sim;
        }
      }

      if (highestNameSim >= 0.82) {
        // LAYER 3: Semantic Complaint Text Overlap
        const semanticSim = calculateSemanticOverlap(
          newComplaint.description,
          existingCase.description
        );

        // Category similarity check
        const categoryMatch =
          newComplaint.category && existingCase.category &&
          (newComplaint.category === existingCase.category ||
            newComplaint.category.includes(existingCase.category) ||
            existingCase.category.includes(newComplaint.category))
            ? 0.25
            : 0.0;

        matchConfidence = highestNameSim * 0.55 + semanticSim * 0.3 + categoryMatch;
        detectionMethod = "Layer 2 & 3: Fuzzy Name (Jaro-Winkler) + Semantic NLP";
        reason = `Institution name match score: ${(highestNameSim * 100).toFixed(0)}%. Complaint topic similarity: ${(semanticSim * 100).toFixed(0)}%.`;
      }
    }

    // LAYER 4: Cross-Bureau Collision Filter
    if (matchConfidence >= 0.7) {
      const isCrossBureau = newComplaint.assignedBureau !== existingCase.assignedBureau;
      findings.push({
        matchedCase: existingCase,
        confidence: Math.min(1.0, matchConfidence),
        detectionMethod,
        reason,
        isCrossBureau,
        alertTitle: isCrossBureau
          ? "Potential Overlapping Cases – Coordination Required"
          : "Potential Intra-Bureau Duplicate Complaint"
      });
    }
  }

  // Sort by highest confidence first
  findings.sort((a, b) => b.confidence - a.confidence);
  return findings;
}
