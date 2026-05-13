import React, { useEffect, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import {
  getAcceptedTags,
  getParticipantSummary,
  getTagColors,
  getTagColorStyle,
  normalizeTags,
  TAG_COLOR_OPTIONS
} from '../utils/mofasaAnalysis';

const exportColumns = [
  { key: 'participantId', label: 'Participant' },
  { key: 'identity', label: 'Identity' },
  { key: 'situation', label: 'Situation' },
  { key: 'definitionOfSituation', label: 'Definition of Situation' },
  { key: 'decision', label: 'Decision' },
  { key: 'tags', label: 'Tags' }
];

const escapeCsv = (value) => {
  const text = Array.isArray(value) ? value.join('; ') : String(value || '');
  return `"${text.replace(/"/g, '""')}"`;
};

const downloadTextFile = (fileName, text, type) => {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const sanitizeFileName = (value) => (
  String(value || 'mofasa').replace(/[\\/:*?"<>|]+/g, '_')
);

const tagChipStyle = {
  padding: '4px 7px',
  borderRadius: '999px',
  background: '#f7f1d7',
  color: '#6b5a24',
  fontSize: '0.78em',
  fontWeight: 700
};

const buildTagChipStyle = (colorId) => {
  const color = getTagColorStyle(colorId);
  return {
    padding: '4px 7px',
    borderRadius: '999px',
    background: color.background,
    color: color.color,
    border: `1px solid ${color.border}`,
    fontSize: '0.78em',
    fontWeight: 700
  };
};

const decisionChipStyle = {
  display: 'inline-block',
  padding: '6px 10px',
  borderRadius: '999px',
  background: '#eaf4fb',
  color: '#1a5276',
  fontSize: '0.86em',
  fontWeight: 700,
  lineHeight: 1.4,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere'
};

const undesirableDecisionChipStyle = {
  ...decisionChipStyle,
  background: '#e74c3c',
  color: '#fff',
  border: '1px solid #e74c3c'
};

const splitPillItems = (value) => (
  String(value || '')
    .split(/\n|;|\s+\|\s+/)
    .map(item => item.trim())
    .filter(Boolean)
);

const CrossParticipantSummaryView = ({
  project,
  currentScope,
  participants,
  onAddParticipant,
  onOpenParticipant,
  onUpdateParticipantTagColor
}) => {
  const [conditionFilter, setConditionFilter] = useState('');
  const [selectedRules, setSelectedRules] = useState([]);
  const [ruleDraft, setRuleDraft] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagDraft, setTagDraft] = useState('');
  const [matchAllTags, setMatchAllTags] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [undesirableRules, setUndesirableRules] = useState([]);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [selectedTagColorEdit, setSelectedTagColorEdit] = useState(null);

  useEffect(() => {
    const loadUndesirableRules = async () => {
      if (!currentScope?.id || !window.electronAPI?.getUndesirableRules) {
        setUndesirableRules([]);
        return;
      }

      try {
        const rules = await window.electronAPI.getUndesirableRules(currentScope.id);
        setUndesirableRules(Array.isArray(rules) ? rules : []);
      } catch (error) {
        console.error('Error loading undesirable rules for summary table:', error);
        setUndesirableRules([]);
      }
    };

    loadUndesirableRules();
  }, [currentScope?.id]);

  const rows = useMemo(() => (
    (participants || []).map(participant => ({
      participant,
      summary: getParticipantSummary(participant, currentScope)
    }))
  ), [participants, currentScope]);

  const allTags = normalizeTags(rows.flatMap(row => row.summary.tags));
  const allRules = Array.from(new Set(rows
    .flatMap(row => splitPillItems(row.summary.appropriatenessCondition || row.summary.impliedRule))
    .filter(Boolean)))
    .sort((a, b) => a.localeCompare(b));
  const conditions = Array.from(new Set(rows.map(row => row.summary.condition).filter(Boolean))).sort();
  const topTags = allTags
    .map(tag => ({
      tag,
      count: rows.filter(row => row.summary.tags.includes(tag)).length
    }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, 8);

  const filteredRows = rows.filter(({ summary }) => {
    if (conditionFilter && summary.condition !== conditionFilter) return false;

    if (selectedRules.length > 0) {
      const rowRules = new Set(splitPillItems(summary.appropriatenessCondition || summary.impliedRule).map(rule => rule.toLowerCase()));
      const matchesRule = selectedRules.some(rule => rowRules.has(rule.toLowerCase()));
      if (!matchesRule) return false;
    }

    if (selectedTags.length > 0) {
      const rowTags = new Set(summary.tags.map(tag => tag.toLowerCase()));
      const selected = selectedTags.map(tag => tag.toLowerCase());
      const matches = matchAllTags
        ? selected.every(tag => rowTags.has(tag))
        : selected.some(tag => rowTags.has(tag));
      if (!matches) return false;
    }

    if (searchText.trim()) {
      const haystack = [
        summary.participantId,
        summary.keyIdentityFactors,
        summary.observedReaction,
        summary.situationHighlights,
        summary.definitionOfSituationHighlights,
        summary.appropriatenessCondition,
        summary.impliedRule,
        ...summary.tags
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(searchText.trim().toLowerCase())) return false;
    }

    return true;
  });

  const exportRows = filteredRows.map(({ summary }) => ({
    participantId: summary.participantId,
    identity: summary.keyIdentityFactors,
    situation: summary.observedReaction || summary.situationHighlights,
    definitionOfSituation: summary.definitionOfSituationHighlights,
    decision: summary.appropriatenessCondition || summary.impliedRule,
    tags: summary.tags
  }));

  const pdfRows = filteredRows.map(({ participant, summary }) => ({
    participantId: summary.participantId,
    identity: summary.keyIdentityFactors,
    situation: summary.observedReaction || summary.situationHighlights,
    definitionOfSituation: summary.definitionOfSituationHighlights,
    decisions: splitPillItems(summary.appropriatenessCondition || summary.impliedRule),
    tags: getAcceptedTags(participant).map(tag => ({
      tag,
      color: getTagColorStyle(getTagColors(participant)[tag])
    }))
  }));

  const handleExportCsv = () => {
    const header = exportColumns.map(column => escapeCsv(column.label)).join(',');
    const body = exportRows
      .map(row => exportColumns.map(column => escapeCsv(row[column.key])).join(','))
      .join('\n');
    downloadTextFile(`${project?.name || 'mofasa'}_cross_participant_summary.csv`, `${header}\n${body}`, 'text/csv;charset=utf-8');
  };

  const handleExportJson = () => {
    downloadTextFile(
      `${project?.name || 'mofasa'}_cross_participant_summary.json`,
      JSON.stringify(exportRows, null, 2),
      'application/json;charset=utf-8'
    );
  };

  const handleExportPdf = () => {
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 28;
    const usableWidth = pageWidth - (margin * 2);
    const lineHeight = 10;
    const cellPadding = 5;
    const headerHeight = 26;
    const columns = [
      { key: 'participantId', label: 'Participant', width: 70 },
      { key: 'identity', label: 'Identity', width: 120 },
      { key: 'situation', label: 'Situation', width: 155 },
      { key: 'definitionOfSituation', label: 'Definition of Situation', width: 170 },
      { key: 'decision', label: 'Decision', width: 150 },
      { key: 'tags', label: 'Tags', width: usableWidth - 665 }
    ];

    const drawTitle = () => {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(44, 62, 80);
      pdf.text('Cross-Participant MoFASA Summary', margin, margin);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(96, 112, 128);
      pdf.text(`${project?.name || 'MoFASA'}${currentScope?.scopeText ? ` - ${currentScope.scopeText}` : ''}`, margin, margin + 14);
    };

    const drawHeader = (startY) => {
      let x = margin;
      pdf.setFillColor(248, 249, 250);
      pdf.setDrawColor(220, 221, 225);
      pdf.rect(margin, startY, usableWidth, headerHeight, 'FD');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(44, 62, 80);
      columns.forEach(column => {
        pdf.text(column.label, x + cellPadding, startY + 16, { maxWidth: column.width - (cellPadding * 2) });
        x += column.width;
      });
      return startY + headerHeight;
    };

    const startPage = () => {
      drawTitle();
      return drawHeader(margin + 30);
    };

    let y = startPage();

    const drawPillList = (items, x, startY, width, rowHeight, getStyle) => {
      let pillX = x + cellPadding;
      let pillY = startY + cellPadding;
      const maxX = x + width - cellPadding;

      items.forEach(item => {
        const label = typeof item === 'string' ? item : item.label;
        const style = getStyle(item);
        const labelWidth = Math.min(pdf.getTextWidth(label) + 12, width - (cellPadding * 2));
        const pillHeight = 16;

        if (pillX + labelWidth > maxX) {
          pillX = x + cellPadding;
          pillY += pillHeight + 4;
        }

        if (pillY + pillHeight <= startY + rowHeight - cellPadding) {
          pdf.setFillColor(style.background[0], style.background[1], style.background[2]);
          pdf.setDrawColor(style.border[0], style.border[1], style.border[2]);
          pdf.roundedRect(pillX, pillY, labelWidth, pillHeight, 7, 7, 'FD');
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(7);
          pdf.setTextColor(style.text[0], style.text[1], style.text[2]);
          const labelLines = pdf.splitTextToSize(label, labelWidth - 8);
          pdf.text(labelLines[0] || '', pillX + 6, pillY + 10);
        }

        pillX += labelWidth + 4;
      });
    };

    const estimatePillLines = (items, width, getLabel) => {
      let lines = 1;
      let currentWidth = 0;
      const maxWidth = width - (cellPadding * 2);
      items.forEach(item => {
        const label = getLabel(item);
        const pillWidth = Math.min(pdf.getTextWidth(label) + 16, maxWidth);
        if (currentWidth > 0 && currentWidth + pillWidth + 4 > maxWidth) {
          lines += 1;
          currentWidth = 0;
        }
        currentWidth += pillWidth + 4;
      });
      return lines;
    };

    const colorToRgb = (hex) => {
      const clean = String(hex || '#000000').replace('#', '');
      return [
        parseInt(clean.slice(0, 2), 16),
        parseInt(clean.slice(2, 4), 16),
        parseInt(clean.slice(4, 6), 16)
      ];
    };

    pdfRows.forEach(row => {
      const rowForText = {
        ...row,
        decision: row.decisions.join('; '),
        tags: row.tags.map(item => item.tag).join('; ')
      };
      const cellLines = columns.map(column => {
        const value = rowForText[column.key];
        return pdf.splitTextToSize(String(value || ''), column.width - (cellPadding * 2));
      });
      const decisionColumn = columns.find(column => column.key === 'decision');
      const tagColumn = columns.find(column => column.key === 'tags');
      const decisionPillLines = estimatePillLines(row.decisions, decisionColumn.width, item => item);
      const tagPillLines = estimatePillLines(row.tags, tagColumn.width, item => item.tag);
      const pillLineCount = Math.max(decisionPillLines, tagPillLines);

      let offset = 0;
      while (offset < Math.max(...cellLines.map(lines => lines.length), 1)) {
        const availableLines = Math.max(
          1,
          Math.floor((pageHeight - margin - y - (cellPadding * 2)) / lineHeight)
        );
        const maxRowLines = Math.max(...cellLines.map(lines => lines.length - offset), 1);
        const linesThisPage = Math.min(availableLines, maxRowLines);
        const rowHeight = Math.max(24, (linesThisPage * lineHeight) + (cellPadding * 2), (pillLineCount * 20) + (cellPadding * 2));

        if (y + rowHeight > pageHeight - margin) {
          pdf.addPage();
          y = startPage();
          continue;
        }

        let x = margin;
        pdf.setDrawColor(233, 236, 239);
        pdf.setFillColor(255, 255, 255);
        pdf.rect(margin, y, usableWidth, rowHeight, 'FD');

        columns.forEach((column, columnIndex) => {
          const lines = cellLines[columnIndex].slice(offset, offset + linesThisPage);
          pdf.setDrawColor(233, 236, 239);
          pdf.line(x, y, x, y + rowHeight);
          if (column.key === 'decision') {
            drawPillList(
              row.decisions.map(decision => ({ label: decision, undesirable: undesirableRules.includes(decision) })),
              x,
              y,
              column.width,
              rowHeight,
              item => item.undesirable
                ? { background: [231, 76, 60], border: [231, 76, 60], text: [255, 255, 255] }
                : { background: [234, 244, 251], border: [183, 216, 239], text: [26, 82, 118] }
            );
          } else if (column.key === 'tags') {
            drawPillList(
              row.tags.map(item => ({ label: item.tag, color: item.color })),
              x,
              y,
              column.width,
              rowHeight,
              item => ({
                background: colorToRgb(item.color.background),
                border: colorToRgb(item.color.border),
                text: colorToRgb(item.color.color)
              })
            );
          } else {
            pdf.setFont('helvetica', column.key === 'participantId' ? 'bold' : 'normal');
            pdf.setFontSize(7.2);
            pdf.setTextColor(column.key === 'participantId' ? 41 : 44, column.key === 'participantId' ? 128 : 62, column.key === 'participantId' ? 185 : 80);
            pdf.text(lines.length > 0 ? lines : [''], x + cellPadding, y + cellPadding + 8, {
              maxWidth: column.width - (cellPadding * 2),
              lineHeightFactor: 1.25
            });
          }
          x += column.width;
        });

        pdf.line(margin + usableWidth, y, margin + usableWidth, y + rowHeight);
        y += rowHeight;
        offset += linesThisPage;

        if (offset < Math.max(...cellLines.map(lines => lines.length), 1)) {
          pdf.addPage();
          y = startPage();
        }
      }
    });

    const pageCount = pdf.internal.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      pdf.setPage(page);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(127, 140, 141);
      pdf.text(`Page ${page} of ${pageCount}`, pageWidth - margin - 55, pageHeight - 14);
    }

    pdf.save(`${sanitizeFileName(project?.name || 'mofasa')}_cross_participant_summary.pdf`);
  };

  const addTagFilter = () => {
    const tag = tagDraft.trim();
    if (!tag || selectedTags.includes(tag)) return;
    setSelectedTags(prev => [...prev, tag]);
    setTagDraft('');
  };

  const addRuleFilter = () => {
    const rule = ruleDraft.trim();
    if (!rule || selectedRules.includes(rule)) return;
    setSelectedRules(prev => [...prev, rule]);
    setRuleDraft('');
  };

  const toggleUndesirableRule = async (rule) => {
    if (!currentScope?.id || !rule) return;

    const isUndesirable = undesirableRules.includes(rule);
    const nextRules = isUndesirable
      ? undesirableRules.filter(item => item !== rule)
      : [...undesirableRules, rule];

    setUndesirableRules(nextRules);
    setSelectedDecision(null);

    try {
      if (isUndesirable) {
        await window.electronAPI.removeUndesirableRule(currentScope.id, rule);
      } else {
        await window.electronAPI.addUndesirableRule(currentScope.id, rule);
      }
    } catch (error) {
      console.error('Error updating undesirable rule from summary table:', error);
      setUndesirableRules(undesirableRules);
    }
  };

  const fullText = (value, fallback = 'Not summarized') => {
    const text = String(value || '').trim();
    if (!text) return fallback;
    return text;
  };

  const renderSummaryText = (value, fallback) => (
    <div style={{
      color: value ? '#2c3e50' : '#95a5a6',
      lineHeight: 1.45,
      fontSize: '0.9em',
      whiteSpace: 'pre-wrap',
      overflowWrap: 'anywhere'
    }}>
      {fullText(value, fallback)}
    </div>
  );

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '18px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
      }}>
        <h3 style={{
          margin: '0 0 8px 0',
          fontFamily: 'Lexend, sans-serif',
          color: '#2c3e50',
          fontSize: '1.15em'
        }}>
          Cross-Participant MoFASA Summary
        </h3>
      </div>

      {topTags.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontFamily: 'Lexend, sans-serif', fontWeight: 700, color: '#2c3e50', marginBottom: '10px' }}>
              Common Tags
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {topTags.length > 0 ? topTags.map(({ tag, count }) => (
                <span key={tag} style={{ ...tagChipStyle, padding: '6px 9px', fontFamily: 'Lexend, sans-serif', fontSize: '0.82em' }}>
                  {tag} ({count})
                </span>
              )) : <span style={{ color: '#95a5a6', fontFamily: 'Lexend, sans-serif', fontSize: '0.9em' }}>No tags yet</span>}
            </div>
          </div>
        </div>
      )}

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'flex-end',
        marginBottom: '16px',
        background: '#fff',
        border: '1px solid #e9ecef',
        borderRadius: '10px',
        padding: '14px'
      }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'Lexend, sans-serif', fontSize: '0.85em', color: '#34495e' }}>
          Condition / Scenario
          <select value={conditionFilter} onChange={(e) => setConditionFilter(e.target.value)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #dcdde1' }}>
            <option value="">All</option>
            {conditions.map(condition => <option key={condition} value={condition}>{condition}</option>)}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'Lexend, sans-serif', fontSize: '0.85em', color: '#34495e', minWidth: '250px' }}>
          Rules
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              list="cross-summary-rules"
              value={ruleDraft}
              onChange={(e) => setRuleDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addRuleFilter();
                }
              }}
              placeholder="Filter by rule"
              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #dcdde1' }}
            />
            <button type="button" onClick={addRuleFilter} style={{ padding: '8px 10px', border: 'none', borderRadius: '6px', background: '#2980b9', color: '#fff', cursor: 'pointer' }}>
              Add
            </button>
          </div>
          <datalist id="cross-summary-rules">
            {allRules.map(rule => <option key={rule} value={rule} />)}
          </datalist>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'Lexend, sans-serif', fontSize: '0.85em', color: '#34495e', minWidth: '210px' }}>
          Tags
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              list="cross-summary-tags"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTagFilter();
                }
              }}
              placeholder="Filter by tag"
              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #dcdde1' }}
            />
            <button type="button" onClick={addTagFilter} style={{ padding: '8px 10px', border: 'none', borderRadius: '6px', background: '#2980b9', color: '#fff', cursor: 'pointer' }}>
              Add
            </button>
          </div>
          <datalist id="cross-summary-tags">
            {allTags.map(tag => <option key={tag} value={tag} />)}
          </datalist>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'Lexend, sans-serif', fontSize: '0.85em', color: '#34495e', paddingBottom: '8px' }}>
          <input type="checkbox" checked={matchAllTags} onChange={(e) => setMatchAllTags(e.target.checked)} />
          Match all tags
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 240px', fontFamily: 'Lexend, sans-serif', fontSize: '0.85em', color: '#34495e' }}>
          Search
          <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search all columns..." style={{ padding: '8px', borderRadius: '6px', border: '1px solid #dcdde1' }} />
        </label>

        <button type="button" onClick={handleExportCsv} style={{ padding: '9px 12px', border: 'none', borderRadius: '6px', background: '#27ae60', color: '#fff', cursor: 'pointer', fontFamily: 'Lexend, sans-serif', fontWeight: 600 }}>
          Export CSV
        </button>
        <button type="button" onClick={handleExportJson} style={{ padding: '9px 12px', border: 'none', borderRadius: '6px', background: '#34495e', color: '#fff', cursor: 'pointer', fontFamily: 'Lexend, sans-serif', fontWeight: 600 }}>
          Export JSON
        </button>
        <button type="button" onClick={handleExportPdf} style={{ padding: '9px 12px', border: 'none', borderRadius: '6px', background: '#c0392b', color: '#fff', cursor: 'pointer', fontFamily: 'Lexend, sans-serif', fontWeight: 600 }}>
          Download PDF
        </button>
        <button type="button" onClick={onAddParticipant} style={{ padding: '9px 12px', border: 'none', borderRadius: '6px', background: '#8f4d6e', color: '#fff', cursor: 'pointer', fontFamily: 'Lexend, sans-serif', fontWeight: 600 }}>
          Add Participant
        </button>
      </div>

      {selectedTags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          {selectedTags.map(tag => (
            <span key={tag} style={{ ...tagChipStyle, display: 'inline-flex', gap: '8px', alignItems: 'center', padding: '6px 10px', fontFamily: 'Lexend, sans-serif', fontSize: '0.84em' }}>
              {tag}
              <button type="button" onClick={() => setSelectedTags(prev => prev.filter(item => item !== tag))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b5a24', fontWeight: 700 }}>x</button>
            </span>
          ))}
        </div>
      )}

      {selectedRules.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          {selectedRules.map(rule => (
            <span key={rule} style={{ ...decisionChipStyle, display: 'inline-flex', gap: '8px', alignItems: 'center', padding: '6px 10px', fontFamily: 'Lexend, sans-serif' }}>
              {rule}
              <button type="button" onClick={() => setSelectedRules(prev => prev.filter(item => item !== rule))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#1a5276', fontWeight: 700 }}>x</button>
            </span>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <div style={{ padding: '28px', border: '1px dashed #ccd5df', borderRadius: '10px', textAlign: 'center', color: '#7f8c8d', fontFamily: 'Lexend, sans-serif' }}>
          No participant summaries yet. Add your first participant summary to start comparing MoFASA patterns across conditions.
        </div>
      ) : (
        <div style={{ border: '1px solid #e9ecef', borderRadius: '10px', background: '#fff', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Lexend, sans-serif', fontSize: '0.86em', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', color: '#2c3e50' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', width: '13%' }}>Participant</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', width: '18%' }}>Identity</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', width: '20%' }}>Situation</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', width: '20%' }}>Definition of Situation</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', width: '17%' }}>Decision</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', width: '17%' }}>Tags</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #e9ecef', width: '8%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(({ participant, summary }) => {
                const tags = getAcceptedTags(participant);
                const tagColors = getTagColors(participant);
                const decisions = splitPillItems(summary.appropriatenessCondition || summary.impliedRule);

                return (
                    <tr key={participant.id} style={{ borderBottom: '1px solid #f0f2f4', verticalAlign: 'top' }}>
                      <td style={{ padding: '12px' }}>
                        <button type="button" onClick={() => onOpenParticipant(participant.id)} style={{ border: 'none', background: 'transparent', color: '#2980b9', cursor: 'pointer', fontFamily: 'Lexend, sans-serif', fontWeight: 800, padding: 0, marginBottom: '6px' }}>
                          {summary.participantId}
                        </button>
                      </td>
                      <td style={{ padding: '12px' }}>
                        {renderSummaryText(summary.keyIdentityFactors, 'No identity notes')}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {renderSummaryText(summary.observedReaction || summary.situationHighlights, 'No situation notes')}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {renderSummaryText(summary.definitionOfSituationHighlights, 'No interpretation notes')}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {decisions.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {decisions.map((decision, index) => (
                              <button
                                type="button"
                                key={`${decision}-${index}`}
                                onClick={() => setSelectedDecision(decision)}
                                style={{
                                  ...(undesirableRules.includes(decision) ? undesirableDecisionChipStyle : decisionChipStyle),
                                  border: undesirableRules.includes(decision) ? undesirableDecisionChipStyle.border : 'none',
                                  cursor: 'pointer',
                                  fontFamily: 'Lexend, sans-serif',
                                  textAlign: 'left'
                                }}
                                title="Click to label this decision"
                              >
                                {decision}
                              </button>
                            ))}
                          </div>
                        ) : renderSummaryText('', 'No judgment notes')}
                      </td>
                      <td style={{ padding: '12px' }}>
                        {tags.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px' }}>
                            {tags.map(tag => (
                              <button
                                type="button"
                                key={tag}
                                onClick={() => setSelectedTagColorEdit({ participantId: participant.id, tag, colorId: tagColors[tag] })}
                                style={{
                                  ...buildTagChipStyle(tagColors[tag]),
                                  cursor: 'pointer',
                                  fontFamily: 'Lexend, sans-serif'
                                }}
                                title="Edit tag color"
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        )}
                        {tags.length === 0 && (
                          <span style={{ color: '#95a5a6', fontSize: '0.9em' }}>No tags</span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button type="button" onClick={() => onOpenParticipant(participant.id)} style={{ display: 'block', width: '100%', padding: '7px 10px', border: 'none', borderRadius: '5px', background: '#2980b9', color: '#fff', cursor: 'pointer', fontFamily: 'Lexend, sans-serif' }}>
                          Open
                        </button>
                      </td>
                    </tr>
                );
              })}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#7f8c8d' }}>
                    No rows match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedDecision && (
        <div
          onClick={() => setSelectedDecision(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '360px',
              maxWidth: '90vw',
              backgroundColor: '#fff',
              borderRadius: '10px',
              padding: '18px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
              border: '1px solid #e9ecef',
              fontFamily: 'Lexend, sans-serif'
            }}
          >
            <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '1em' }}>
              Label Decision
            </h4>
            <div style={{
              marginBottom: '16px',
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: undesirableRules.includes(selectedDecision) ? '#fdecea' : '#eaf4fb',
              color: undesirableRules.includes(selectedDecision) ? '#c0392b' : '#1a5276',
              fontSize: '0.9em',
              fontWeight: 700,
              lineHeight: 1.45
            }}>
              {selectedDecision}
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedDecision(null)}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #d0d7de',
                  borderRadius: '6px',
                  background: '#fff',
                  color: '#2c3e50',
                  cursor: 'pointer',
                  fontFamily: 'Lexend, sans-serif'
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => toggleUndesirableRule(selectedDecision)}
                style={{
                  padding: '8px 12px',
                  border: 'none',
                  borderRadius: '6px',
                  background: undesirableRules.includes(selectedDecision) ? '#95a5a6' : '#e74c3c',
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: 'Lexend, sans-serif',
                  fontWeight: 700
                }}
              >
                {undesirableRules.includes(selectedDecision) ? 'Remove Undesirable' : 'Label as Undesirable'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTagColorEdit && (
        <div
          onClick={() => setSelectedTagColorEdit(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: '360px',
              maxWidth: '90vw',
              backgroundColor: '#fff',
              borderRadius: '10px',
              padding: '18px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
              border: '1px solid #e9ecef',
              fontFamily: 'Lexend, sans-serif'
            }}
          >
            <h4 style={{ margin: '0 0 12px 0', color: '#2c3e50', fontSize: '1em' }}>
              Tag Color
            </h4>
            <div style={{ marginBottom: '14px' }}>
              <span style={{ ...buildTagChipStyle(selectedTagColorEdit.colorId), display: 'inline-flex', padding: '6px 10px', fontSize: '0.88em' }}>
                {selectedTagColorEdit.tag}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {TAG_COLOR_OPTIONS.map(option => (
                <button
                  type="button"
                  key={option.id}
                  onClick={() => {
                    onUpdateParticipantTagColor?.(selectedTagColorEdit.participantId, selectedTagColorEdit.tag, option.id);
                    setSelectedTagColorEdit(null);
                  }}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '8px',
                    border: selectedTagColorEdit.colorId === option.id ? `2px solid ${option.color}` : `1px solid ${option.border}`,
                    background: option.background,
                    color: option.color,
                    cursor: 'pointer',
                    fontFamily: 'Lexend, sans-serif',
                    fontWeight: 700
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSelectedTagColorEdit(null)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d0d7de',
                borderRadius: '6px',
                background: '#fff',
                color: '#2c3e50',
                cursor: 'pointer',
                fontFamily: 'Lexend, sans-serif',
                fontWeight: 600
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrossParticipantSummaryView;
