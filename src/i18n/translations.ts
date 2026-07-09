import type { Lang } from "./config";
import { extraDicts } from "./translations.extra";

/**
 * Flat message catalog. Core languages are inline per entry; additional
 * languages are merged from `translations.extra`. `en` is always present and
 * used as the fallback for any missing key/language.
 */
type Entry = { en: string } & Partial<Record<Lang, string>>;

export const messages: Record<string, Entry> = {
  // ── Toolbar ────────────────────────────────────────────────────────────
  "toolbar.symbol": { en: "Symbol", ru: "Символ", es: "Símbolo", fr: "Symbole", de: "Symbol", zh: "品种", ja: "銘柄" },
  "toolbar.chartType": { en: "Chart type", ru: "Тип графика", es: "Tipo de gráfico", fr: "Type de graphique", de: "Charttyp", zh: "图表类型", ja: "チャートタイプ" },
  "toolbar.indicators": { en: "Indicators", ru: "Индикаторы", es: "Indicadores", fr: "Indicateurs", de: "Indikatoren", zh: "指标", ja: "インジケーター" },
  "toolbar.tools": { en: "Tools", ru: "Инструменты", es: "Herramientas", fr: "Outils", de: "Werkzeuge", zh: "工具", ja: "ツール" },
  "toolbar.settings": { en: "Settings", ru: "Настройки", es: "Ajustes", fr: "Paramètres", de: "Einstellungen", zh: "设置", ja: "設定" },
  "toolbar.undo": { en: "Undo (Ctrl+Z)", ru: "Отменить (Ctrl+Z)", es: "Deshacer (Ctrl+Z)", fr: "Annuler (Ctrl+Z)", de: "Rückgängig (Ctrl+Z)", zh: "撤销 (Ctrl+Z)", ja: "元に戻す (Ctrl+Z)" },
  "toolbar.redo": { en: "Redo (Ctrl+Y)", ru: "Повторить (Ctrl+Y)", es: "Rehacer (Ctrl+Y)", fr: "Rétablir (Ctrl+Y)", de: "Wiederholen (Ctrl+Y)", zh: "重做 (Ctrl+Y)", ja: "やり直す (Ctrl+Y)" },
  "toolbar.commandPalette": { en: "Command palette (Ctrl+K)", ru: "Палитра команд (Ctrl+K)", es: "Paleta de comandos (Ctrl+K)", fr: "Palette de commandes (Ctrl+K)", de: "Befehlspalette (Ctrl+K)", zh: "命令面板 (Ctrl+K)", ja: "コマンドパレット (Ctrl+K)" },
  "toolbar.screenshot": { en: "Screenshot", ru: "Снимок", es: "Captura", fr: "Capture", de: "Screenshot", zh: "截图", ja: "スクリーンショット" },
  "toolbar.theme": { en: "Theme", ru: "Тема", es: "Tema", fr: "Thème", de: "Thema", zh: "主题", ja: "テーマ" },
  "toolbar.fullscreen": { en: "Fullscreen", ru: "Полный экран", es: "Pantalla completa", fr: "Plein écran", de: "Vollbild", zh: "全屏", ja: "全画面" },
  "toolbar.trade": { en: "Trade", ru: "Торговать", es: "Operar", fr: "Trader", de: "Handeln", zh: "交易", ja: "取引" },
  "toolbar.tradeMode": { en: "Trading mode", ru: "Режим торговли", es: "Modo de trading", fr: "Mode trading", de: "Handelsmodus", zh: "交易模式", ja: "取引モード" },
  "toolbar.layoutName": { en: "Layout name", ru: "Название раскладки", es: "Nombre del diseño", fr: "Nom de la mise en page", de: "Layoutname", zh: "布局名称", ja: "レイアウト名" },
  "toolbar.untitled": { en: "Untitled", ru: "Без названия", es: "Sin título", fr: "Sans titre", de: "Unbenannt", zh: "未命名", ja: "無題" },
  "toolbar.drawingTools": { en: "Drawing tools", ru: "Инструменты рисования", es: "Herramientas de dibujo", fr: "Outils de dessin", de: "Zeichenwerkzeuge", zh: "绘图工具", ja: "描画ツール" },

  // ── Tools menu ─────────────────────────────────────────────────────────
  "tools.orderLines": { en: "Order lines", ru: "Ордерные линии", es: "Líneas de orden", fr: "Lignes d'ordre", de: "Orderlinien", zh: "订单线", ja: "注文ライン" },
  "tools.alerts": { en: "Alerts", ru: "Алерты", es: "Alertas", fr: "Alertes", de: "Alarme", zh: "提醒", ja: "アラート" },
  "tools.compare": { en: "Compare symbols", ru: "Сравнить символы", es: "Comparar símbolos", fr: "Comparer les symboles", de: "Symbole vergleichen", zh: "对比品种", ja: "銘柄を比較" },
  "tools.annotations": { en: "Notes", ru: "Заметки", es: "Notas", fr: "Notes", de: "Notizen", zh: "笔记", ja: "メモ" },
  "tools.measure": { en: "Measure", ru: "Линейка", es: "Medir", fr: "Mesure", de: "Messen", zh: "测量", ja: "計測" },
  "tools.replay": { en: "Bar replay", ru: "Bar Replay", es: "Reproducción de barras", fr: "Relecture des barres", de: "Bar-Replay", zh: "回放", ja: "バーリプレイ" },
  "tools.script": { en: "Indicator editor", ru: "Редактор индикаторов", es: "Editor de indicadores", fr: "Éditeur d'indicateurs", de: "Indikator-Editor", zh: "指标编辑器", ja: "インジケーターエディタ" },
  "tools.layouts": { en: "Layouts", ru: "Раскладки", es: "Diseños", fr: "Mises en page", de: "Layouts", zh: "布局", ja: "レイアウト" },
  "tools.timezone": { en: "Timezone", ru: "Часовой пояс", es: "Zona horaria", fr: "Fuseau horaire", de: "Zeitzone", zh: "时区", ja: "タイムゾーン" },
  "tools.exportCsv": { en: "Export CSV", ru: "Экспорт CSV", es: "Exportar CSV", fr: "Exporter CSV", de: "CSV exportieren", zh: "导出 CSV", ja: "CSV を書き出し" },
  "tools.exportJson": { en: "Export JSON", ru: "Экспорт JSON", es: "Exportar JSON", fr: "Exporter JSON", de: "JSON exportieren", zh: "导出 JSON", ja: "JSON を書き出し" },

  // ── Command palette ────────────────────────────────────────────────────
  "cmd.title": { en: "Command palette", ru: "Командная палитра", es: "Paleta de comandos", fr: "Palette de commandes", de: "Befehlspalette", zh: "命令面板", ja: "コマンドパレット" },
  "cmd.placeholder": { en: "Command or symbol…", ru: "Команда или символ…", es: "Comando o símbolo…", fr: "Commande ou symbole…", de: "Befehl oder Symbol…", zh: "命令或品种…", ja: "コマンドまたは銘柄…" },
  "cmd.symbols": { en: "Symbols", ru: "Символы", es: "Símbolos", fr: "Symboles", de: "Symbole", zh: "品种", ja: "銘柄" },
  "cmd.commands": { en: "Commands", ru: "Команды", es: "Comandos", fr: "Commandes", de: "Befehle", zh: "命令", ja: "コマンド" },
  "cmd.empty": { en: "Nothing found", ru: "Ничего не найдено", es: "No se encontró nada", fr: "Aucun résultat", de: "Nichts gefunden", zh: "未找到", ja: "見つかりません" },
  "cmd.symbolSearch": { en: "Symbol search", ru: "Поиск символа", es: "Buscar símbolo", fr: "Rechercher un symbole", de: "Symbolsuche", zh: "品种搜索", ja: "銘柄検索" },
  "cmd.settingsFull": { en: "Chart settings", ru: "Настройки графика", es: "Ajustes del gráfico", fr: "Paramètres du graphique", de: "Chart-Einstellungen", zh: "图表设置", ja: "チャート設定" },
  "cmd.screenshot": { en: "Chart screenshot", ru: "Снимок графика", es: "Captura del gráfico", fr: "Capture du graphique", de: "Chart-Screenshot", zh: "图表截图", ja: "チャートのスクリーンショット" },
  "cmd.exportCsvFull": { en: "Export to CSV", ru: "Экспорт в CSV", es: "Exportar a CSV", fr: "Exporter en CSV", de: "Als CSV exportieren", zh: "导出为 CSV", ja: "CSV に書き出し" },
  "cmd.exportJsonFull": { en: "Export to JSON", ru: "Экспорт в JSON", es: "Exportar a JSON", fr: "Exporter en JSON", de: "Als JSON exportieren", zh: "导出为 JSON", ja: "JSON に書き出し" },
  "cmd.theme": { en: "Toggle theme", ru: "Сменить тему", es: "Cambiar tema", fr: "Changer de thème", de: "Thema wechseln", zh: "切换主题", ja: "テーマ切替" },

  // ── Right dock / panels ────────────────────────────────────────────────
  "dock.watchlist": { en: "Watchlist", ru: "Список наблюдения", es: "Lista de seguimiento", fr: "Liste de suivi", de: "Beobachtungsliste", zh: "自选列表", ja: "ウォッチリスト" },
  "dock.info": { en: "Symbol info", ru: "Об инструменте", es: "Información del símbolo", fr: "Infos symbole", de: "Symbolinfo", zh: "品种信息", ja: "銘柄情報" },
  "dock.orderbook": { en: "Order book", ru: "Стакан", es: "Libro de órdenes", fr: "Carnet d'ordres", de: "Orderbuch", zh: "订单簿", ja: "板情報" },

  // ── Workspace / multi-chart ───────────────────────────────────────────
  "ws.layout": { en: "Layout" },
  "ws.single": { en: "Single chart" },
  "ws.cols2": { en: "2 columns" },
  "ws.grid4": { en: "2×2 grid" },
  "ws.rows2": { en: "2 rows" },
  "ws.sync": { en: "Sync" },
  "ws.sync.crosshair": { en: "Crosshair" },
  "ws.sync.scroll": { en: "Scroll" },
  "ws.sync.zoom": { en: "Zoom" },
  "ws.sync.symbol": { en: "Symbol" },
  "ws.sync.period": { en: "Period" },
  "ws.addCell": { en: "Add chart" },
  "ws.removeCell": { en: "Remove chart" },
  "ws.maximize": { en: "Maximize" },
  "ws.restore": { en: "Restore" },
  "ws.depth": { en: "Depth" },
  "ws.depthUnsupported": { en: "No depth feed for this symbol" },

  // ── Object tree ───────────────────────────────────────────────────────
  "ot.title": { en: "Object tree" },
  "ot.drawings": { en: "Drawings" },
  "ot.indicators": { en: "Indicators" },
  "ot.orderLines": { en: "Order lines" },
  "ot.notes": { en: "Notes" },
  "ot.alerts": { en: "Alerts" },
  "ot.empty": { en: "No objects yet" },
  "ot.toggleVis": { en: "Toggle visibility" },
  "ot.lock": { en: "Lock" },
  "ot.delete": { en: "Delete" },
  "ot.main": { en: "Main" },
  "ot.sub": { en: "Sub" },

  // ── Alerts: indicator target ──────────────────────────────────────────
  "al.source": { en: "Source" },
  "al.price": { en: "Price" },
  "al.indicator": { en: "Indicator" },
  "al.indicatorPh": { en: "Select indicator" },
  "al.figurePh": { en: "Figure" },
  "al.thresholdPh": { en: "Threshold" },

  // ── Chart context menu ─────────────────────────────────────────────────
  "menu.addAlert": { en: "Add alert", ru: "Добавить алерт", es: "Añadir alerta", fr: "Ajouter une alerte", de: "Alarm hinzufügen", zh: "添加提醒", ja: "アラートを追加" },
  "menu.orderLine": { en: "Order line", ru: "Ордерная линия", es: "Línea de orden", fr: "Ligne d'ordre", de: "Orderlinie", zh: "订单线", ja: "注文ライン" },
  "menu.toRealtime": { en: "Go to last price", ru: "К последней цене", es: "Ir al último precio", fr: "Aller au dernier prix", de: "Zum letzten Preis", zh: "跳转到最新价", ja: "最新価格へ" },

  // ── Drawing sidebar ────────────────────────────────────────────────────
  "draw.cursor": { en: "Cursor", ru: "Курсор", es: "Cursor", fr: "Curseur", de: "Cursor", zh: "光标", ja: "カーソル" },
  "draw.cat.singleLine": { en: "Lines", ru: "Линии", es: "Líneas", fr: "Lignes", de: "Linien", zh: "线", ja: "ライン" },
  "draw.cat.moreLine": { en: "Channels", ru: "Каналы", es: "Canales", fr: "Canaux", de: "Kanäle", zh: "通道", ja: "チャネル" },
  "draw.cat.polygon": { en: "Shapes", ru: "Фигуры", es: "Formas", fr: "Formes", de: "Formen", zh: "形状", ja: "図形" },
  "draw.cat.fibonacci": { en: "Fibonacci", ru: "Фибоначчи", es: "Fibonacci", fr: "Fibonacci", de: "Fibonacci", zh: "斐波那契", ja: "フィボナッチ" },
  "draw.cat.wave": { en: "Waves", ru: "Волны", es: "Ondas", fr: "Vagues", de: "Wellen", zh: "波浪", ja: "波動" },
  "draw.cat.measure": { en: "Measure", ru: "Измерение", es: "Medición", fr: "Mesure", de: "Messung", zh: "测量", ja: "計測" },
  "draw.cat.position": { en: "Positions", ru: "Позиции", es: "Posiciones", fr: "Positions", de: "Positionen", zh: "仓位", ja: "ポジション" },
  "draw.cat.annotation": { en: "Annotations", ru: "Аннотации", es: "Anotaciones", fr: "Annotations", de: "Anmerkungen", zh: "标注", ja: "注釈" },
  "draw.magnet": { en: "Magnet: {mode}", ru: "Магнит: {mode}", es: "Imán: {mode}", fr: "Aimant : {mode}", de: "Magnet: {mode}", zh: "磁吸：{mode}", ja: "マグネット：{mode}" },
  "draw.autoOn": { en: "Auto-repeat: on", ru: "Авто-повтор: вкл", es: "Auto-repetir: sí", fr: "Répétition auto : oui", de: "Auto-Wiederholung: an", zh: "自动重复：开", ja: "自動繰り返し：オン" },
  "draw.autoOff": { en: "Auto-repeat: off", ru: "Авто-повтор: выкл", es: "Auto-repetir: no", fr: "Répétition auto : non", de: "Auto-Wiederholung: aus", zh: "自动重复：关", ja: "自動繰り返し：オフ" },
  "draw.lock": { en: "Lock", ru: "Заблокировать", es: "Bloquear", fr: "Verrouiller", de: "Sperren", zh: "锁定", ja: "ロック" },
  "draw.unlock": { en: "Unlock", ru: "Разблокировать", es: "Desbloquear", fr: "Déverrouiller", de: "Entsperren", zh: "解锁", ja: "ロック解除" },
  "draw.show": { en: "Show drawings", ru: "Показать рисунки", es: "Mostrar dibujos", fr: "Afficher les dessins", de: "Zeichnungen anzeigen", zh: "显示绘图", ja: "描画を表示" },
  "draw.hide": { en: "Hide drawings", ru: "Скрыть рисунки", es: "Ocultar dibujos", fr: "Masquer les dessins", de: "Zeichnungen ausblenden", zh: "隐藏绘图", ja: "描画を非表示" },
  "draw.removeAll": { en: "Remove all drawings", ru: "Удалить все рисунки", es: "Eliminar todos los dibujos", fr: "Supprimer tous les dessins", de: "Alle Zeichnungen entfernen", zh: "删除所有绘图", ja: "すべての描画を削除" },
  "magnet.normal": { en: "off", ru: "выкл", es: "no", fr: "non", de: "aus", zh: "关", ja: "オフ" },
  "magnet.weak": { en: "weak", ru: "слабый", es: "débil", fr: "faible", de: "schwach", zh: "弱", ja: "弱" },
  "magnet.strong": { en: "strong", ru: "сильный", es: "fuerte", fr: "fort", de: "stark", zh: "强", ja: "強" },

  // ── Indicator dialog ───────────────────────────────────────────────────
  "ind.title": { en: "Indicators", ru: "Индикаторы", es: "Indicadores", fr: "Indicateurs", de: "Indikatoren", zh: "指标", ja: "インジケーター" },
  "ind.desc": { en: "Add indicators, edit parameters and toggle visibility.", ru: "Добавляйте, настраивайте параметры и управляйте видимостью индикаторов.", es: "Añade indicadores, edita parámetros y alterna la visibilidad.", fr: "Ajoutez des indicateurs, modifiez les paramètres et la visibilité.", de: "Indikatoren hinzufügen, Parameter bearbeiten und Sichtbarkeit umschalten.", zh: "添加指标、编辑参数并切换可见性。", ja: "インジケーターの追加、パラメータ編集、表示切替。" },
  "ind.tabCatalog": { en: "Catalog", ru: "Каталог", es: "Catálogo", fr: "Catalogue", de: "Katalog", zh: "目录", ja: "カタログ" },
  "ind.tabActive": { en: "Active", ru: "Активные", es: "Activos", fr: "Actifs", de: "Aktiv", zh: "已启用", ja: "有効" },
  "ind.searchPh": { en: "Search indicator…", ru: "Поиск индикатора…", es: "Buscar indicador…", fr: "Rechercher un indicateur…", de: "Indikator suchen…", zh: "搜索指标…", ja: "インジケーター検索…" },
  "ind.onChart": { en: "On chart", ru: "На графике", es: "En el gráfico", fr: "Sur le graphique", de: "Im Chart", zh: "主图", ja: "メイン" },
  "ind.inPanes": { en: "In panes", ru: "В панелях", es: "En paneles", fr: "Dans les volets", de: "In Bereichen", zh: "副图", ja: "サブ" },
  "ind.noParams": { en: "No parameters", ru: "Нет параметров", es: "Sin parámetros", fr: "Aucun paramètre", de: "Keine Parameter", zh: "无参数", ja: "パラメータなし" },
  "ind.pane": { en: "pane", ru: "панель", es: "panel", fr: "volet", de: "Bereich", zh: "副图", ja: "ペイン" },
  "ind.apply": { en: "Apply", ru: "Применить", es: "Aplicar", fr: "Appliquer", de: "Anwenden", zh: "应用", ja: "適用" },
  "ind.paramsOf": { en: "{name} parameters", ru: "{name} · параметры", es: "Parámetros de {name}", fr: "Paramètres de {name}", de: "{name}-Parameter", zh: "{name} 参数", ja: "{name} パラメータ" },
  "ind.paramsAria": { en: "{name} parameters", ru: "Параметры {name}", es: "Parámetros de {name}", fr: "Paramètres de {name}", de: "{name}-Parameter", zh: "{name} 参数", ja: "{name} パラメータ" },
  "ind.show": { en: "Show", ru: "Показать", es: "Mostrar", fr: "Afficher", de: "Anzeigen", zh: "显示", ja: "表示" },
  "ind.hide": { en: "Hide", ru: "Скрыть", es: "Ocultar", fr: "Masquer", de: "Ausblenden", zh: "隐藏", ja: "非表示" },
  "ind.up": { en: "Up", ru: "Вверх", es: "Arriba", fr: "Monter", de: "Hoch", zh: "上移", ja: "上へ" },
  "ind.down": { en: "Down", ru: "Вниз", es: "Abajo", fr: "Descendre", de: "Runter", zh: "下移", ja: "下へ" },
  "ind.expand": { en: "Expand", ru: "Развернуть", es: "Expandir", fr: "Développer", de: "Erweitern", zh: "展开", ja: "展開" },
  "ind.collapse": { en: "Collapse", ru: "Свернуть", es: "Contraer", fr: "Réduire", de: "Einklappen", zh: "折叠", ja: "折りたたみ" },
  "ind.noActive": { en: "No active indicators", ru: "Нет активных индикаторов", es: "Sin indicadores activos", fr: "Aucun indicateur actif", de: "Keine aktiven Indikatoren", zh: "无已启用指标", ja: "有効なインジケーターなし" },
  "ind.ownAxis": { en: "Own Y-axis", ru: "Своя ось Y", es: "Eje Y propio", fr: "Axe Y propre", de: "Eigene Y-Achse", zh: "独立 Y 轴", ja: "独立 Y 軸" },

  // ── Settings dialog ────────────────────────────────────────────────────
  "settings.title": { en: "Chart settings", ru: "Настройки графика", es: "Ajustes del gráfico", fr: "Paramètres du graphique", de: "Chart-Einstellungen", zh: "图表设置", ja: "チャート設定" },
  "settings.sec.candles": { en: "Candles", ru: "Свечи", es: "Velas", fr: "Bougies", de: "Kerzen", zh: "K线", ja: "ローソク足" },
  "settings.sec.priceAxis": { en: "Price axis", ru: "Ось цены", es: "Eje de precios", fr: "Axe des prix", de: "Preisachse", zh: "价格轴", ja: "価格軸" },
  "settings.sec.display": { en: "Display", ru: "Отображение", es: "Visualización", fr: "Affichage", de: "Anzeige", zh: "显示", ja: "表示" },
  "settings.language": { en: "Language", ru: "Язык", es: "Idioma", fr: "Langue", de: "Sprache", zh: "语言", ja: "言語" },
  "settings.type": { en: "Type", ru: "Тип", es: "Tipo", fr: "Type", de: "Typ", zh: "类型", ja: "種類" },
  "settings.upColor": { en: "Up color", ru: "Цвет роста", es: "Color alcista", fr: "Couleur hausse", de: "Farbe steigend", zh: "上涨颜色", ja: "上昇色" },
  "settings.downColor": { en: "Down color", ru: "Цвет падения", es: "Color bajista", fr: "Couleur baisse", de: "Farbe fallend", zh: "下跌颜色", ja: "下降色" },
  "settings.scaleType": { en: "Scale type", ru: "Тип шкалы", es: "Tipo de escala", fr: "Type d'échelle", de: "Skalentyp", zh: "刻度类型", ja: "スケール種別" },
  "settings.position": { en: "Position", ru: "Позиция", es: "Posición", fr: "Position", de: "Position", zh: "位置", ja: "位置" },
  "settings.axisInside": { en: "Axis inside", ru: "Ось внутри", es: "Eje interior", fr: "Axe intérieur", de: "Achse innen", zh: "轴在内侧", ja: "軸を内側に" },
  "settings.reverse": { en: "Reverse scale", ru: "Обратная шкала", es: "Escala invertida", fr: "Échelle inversée", de: "Skala umkehren", zh: "反转刻度", ja: "スケール反転" },
  "settings.lastPrice": { en: "Last price", ru: "Последняя цена", es: "Último precio", fr: "Dernier prix", de: "Letzter Preis", zh: "最新价", ja: "最新価格" },
  "settings.lastPriceLine": { en: "Last price line", ru: "Линия последней цены", es: "Línea del último precio", fr: "Ligne du dernier prix", de: "Linie des letzten Preises", zh: "最新价线", ja: "最新価格ライン" },
  "settings.highLow": { en: "High / low", ru: "Максимум / минимум", es: "Máximo / mínimo", fr: "Haut / bas", de: "Hoch / Tief", zh: "最高/最低", ja: "高値/安値" },
  "settings.grid": { en: "Grid", ru: "Сетка", es: "Cuadrícula", fr: "Grille", de: "Gitter", zh: "网格", ja: "グリッド" },
  "settings.crosshair": { en: "Crosshair", ru: "Перекрестие", es: "Mira", fr: "Réticule", de: "Fadenkreuz", zh: "十字光标", ja: "十字カーソル" },
  "settings.timeAxis": { en: "Time axis", ru: "Ось времени", es: "Eje de tiempo", fr: "Axe du temps", de: "Zeitachse", zh: "时间轴", ja: "時間軸" },
  "settings.candleTooltip": { en: "Candle tooltip", ru: "Подсказка свечи", es: "Información de vela", fr: "Infobulle de bougie", de: "Kerzen-Tooltip", zh: "K线提示", ja: "ローソク足ツールチップ" },
  "settings.indicatorTooltip": { en: "Indicator tooltip", ru: "Подсказка индикатора", es: "Información de indicador", fr: "Infobulle d'indicateur", de: "Indikator-Tooltip", zh: "指标提示", ja: "インジケーターツールチップ" },
  "settings.tooltipRule": { en: "Tooltip rule", ru: "Режим подсказки", es: "Regla de información", fr: "Règle d'infobulle", de: "Tooltip-Regel", zh: "提示规则", ja: "ツールチップ表示" },
  "settings.reset": { en: "Reset", ru: "Сбросить", es: "Restablecer", fr: "Réinitialiser", de: "Zurücksetzen", zh: "重置", ja: "リセット" },

  // ── Order book ─────────────────────────────────────────────────────────
  "ob.price": { en: "Price", ru: "Цена", es: "Precio", fr: "Prix", de: "Preis", zh: "价格", ja: "価格" },
  "ob.size": { en: "Size", ru: "Размер", es: "Tamaño", fr: "Taille", de: "Größe", zh: "数量", ja: "数量" },
  "ob.total": { en: "Total", ru: "Итого", es: "Total", fr: "Total", de: "Summe", zh: "累计", ja: "合計" },
  "ob.unsupported": { en: "Source has no order book", ru: "Источник не предоставляет стакан", es: "La fuente no tiene libro de órdenes", fr: "La source n'a pas de carnet d'ordres", de: "Quelle hat kein Orderbuch", zh: "数据源不提供订单簿", ja: "ソースに板情報がありません" },
  "ob.spread": { en: "spread", ru: "спред", es: "spread", fr: "spread", de: "Spread", zh: "价差", ja: "スプレッド" },

  // ── Order lines dialog ─────────────────────────────────────────────────
  "ol.title": { en: "Order lines", ru: "Ордерные линии", es: "Líneas de orden", fr: "Lignes d'ordre", de: "Orderlinien", zh: "订单线", ja: "注文ライン" },
  "ol.desc": { en: "Draggable entry / stop levels right on the chart.", ru: "Перетаскиваемые уровни входа / стопа прямо на графике.", es: "Niveles de entrada / stop arrastrables en el gráfico.", fr: "Niveaux d'entrée / stop déplaçables sur le graphique.", de: "Verschiebbare Einstiegs-/Stop-Level direkt im Chart.", zh: "可拖动的入场/止损价位，直接显示在图上。", ja: "チャート上でドラッグできるエントリー/ストップ価格。" },
  "ol.pricePh": { en: "Level price", ru: "Цена уровня", es: "Precio del nivel", fr: "Prix du niveau", de: "Level-Preis", zh: "价位", ja: "価格レベル" },
  "ol.empty": { en: "No active lines", ru: "Нет активных линий", es: "Sin líneas activas", fr: "Aucune ligne active", de: "Keine aktiven Linien", zh: "无活动线", ja: "アクティブなラインなし" },
  "common.removeAll": { en: "Remove all", ru: "Удалить все", es: "Eliminar todo", fr: "Tout supprimer", de: "Alle entfernen", zh: "全部删除", ja: "すべて削除" },
  "common.error": { en: "Failed to load data", ru: "Не удалось загрузить данные", es: "Error al cargar datos", fr: "Échec du chargement", de: "Laden fehlgeschlagen", zh: "数据加载失败", ja: "データの読み込みに失敗" },
  "common.retry": { en: "Retry", ru: "Повторить", es: "Reintentar", fr: "Réessayer", de: "Erneut", zh: "重试", ja: "再試行" },
  "common.clear": { en: "Clear", ru: "Очистить", es: "Limpiar", fr: "Effacer", de: "Leeren", zh: "清空", ja: "クリア" },
  "common.long": { en: "Long", ru: "Long", es: "Largo", fr: "Long", de: "Long", zh: "做多", ja: "ロング" },
  "common.short": { en: "Short", ru: "Short", es: "Corto", fr: "Short", de: "Short", zh: "做空", ja: "ショート" },

  // ── Alerts dialog ──────────────────────────────────────────────────────
  "al.title": { en: "Price alerts", ru: "Ценовые алерты", es: "Alertas de precio", fr: "Alertes de prix", de: "Preisalarme", zh: "价格提醒", ja: "価格アラート" },
  "al.desc": { en: "Notification and sound when price crosses a level.", ru: "Уведомление и звук при пересечении ценой уровня.", es: "Notificación y sonido cuando el precio cruza un nivel.", fr: "Notification et son lorsque le prix franchit un niveau.", de: "Benachrichtigung und Ton, wenn der Preis ein Level kreuzt.", zh: "价格穿越价位时通知并发声。", ja: "価格がレベルを横切ると通知と音でお知らせ。" },
  "al.crossingUp": { en: "Crossing up", ru: "Пересекает вверх", es: "Cruce al alza", fr: "Croisement à la hausse", de: "Kreuzt aufwärts", zh: "向上穿越", ja: "上抜け" },
  "al.crossingDown": { en: "Crossing down", ru: "Пересекает вниз", es: "Cruce a la baja", fr: "Croisement à la baisse", de: "Kreuzt abwärts", zh: "向下穿越", ja: "下抜け" },
  "al.crossing": { en: "Crossing", ru: "Пересекает", es: "Cruce", fr: "Croisement", de: "Kreuzt", zh: "穿越", ja: "クロス" },
  "al.pricePh": { en: "Price", ru: "Цена", es: "Precio", fr: "Prix", de: "Preis", zh: "价格", ja: "価格" },
  "al.msgPh": { en: "Message (optional)", ru: "Сообщение (необязательно)", es: "Mensaje (opcional)", fr: "Message (facultatif)", de: "Nachricht (optional)", zh: "消息（可选）", ja: "メッセージ（任意）" },
  "al.empty": { en: "No alerts", ru: "Нет алертов", es: "Sin alertas", fr: "Aucune alerte", de: "Keine Alarme", zh: "无提醒", ja: "アラートなし" },

  // ── Compare dialog ─────────────────────────────────────────────────────
  "cmp.title": { en: "Compare symbols", ru: "Сравнение символов", es: "Comparar símbolos", fr: "Comparer les symboles", de: "Symbole vergleichen", zh: "对比品种", ja: "銘柄の比較" },
  "cmp.desc": { en: "Overlay several symbols, normalized to % from the first bar.", ru: "Наложение нескольких инструментов, нормализованных в % от первой свечи.", es: "Superpone varios símbolos, normalizados a % desde la primera barra.", fr: "Superpose plusieurs symboles, normalisés en % depuis la première barre.", de: "Mehrere Symbole überlagern, normiert auf % ab dem ersten Balken.", zh: "叠加多个品种，按首根K线归一化为百分比。", ja: "複数銘柄を最初の足からの%で正規化して重ね表示。" },
  "cmp.tickerPh": { en: "Ticker (e.g. ETHUSDT)", ru: "Тикер (напр. ETHUSDT)", es: "Ticker (p. ej. ETHUSDT)", fr: "Ticker (ex. ETHUSDT)", de: "Ticker (z. B. ETHUSDT)", zh: "代码（如 ETHUSDT）", ja: "ティッカー（例 ETHUSDT）" },
  "cmp.empty": { en: "No comparisons", ru: "Нет сравнений", es: "Sin comparaciones", fr: "Aucune comparaison", de: "Keine Vergleiche", zh: "无对比", ja: "比較なし" },

  // ── Annotations dialog ─────────────────────────────────────────────────
  "an.title": { en: "Chart notes", ru: "Заметки на графике", es: "Notas del gráfico", fr: "Notes du graphique", de: "Chart-Notizen", zh: "图表笔记", ja: "チャートメモ" },
  "an.desc": { en: "Text labels at price levels. Default price is under the crosshair.", ru: "Текстовые метки на ценовых уровнях. Цена по умолчанию — под перекрестием.", es: "Etiquetas de texto en niveles de precio. El precio por defecto está bajo la mira.", fr: "Étiquettes de texte aux niveaux de prix. Le prix par défaut est sous le réticule.", de: "Textmarken auf Preisniveaus. Standardpreis ist unter dem Fadenkreuz.", zh: "在价位上的文字标签。默认价格取自十字光标处。", ja: "価格レベルのテキストラベル。既定価格は十字カーソル位置。" },
  "an.textPh": { en: "Note text", ru: "Текст заметки", es: "Texto de la nota", fr: "Texte de la note", de: "Notiztext", zh: "笔记文本", ja: "メモ本文" },
  "an.priceCursor": { en: "{price} (under cursor)", ru: "{price} (под курсором)", es: "{price} (bajo el cursor)", fr: "{price} (sous le curseur)", de: "{price} (unter dem Cursor)", zh: "{price}（光标处）", ja: "{price}（カーソル位置）" },
  "an.empty": { en: "No notes", ru: "Нет заметок", es: "Sin notas", fr: "Aucune note", de: "Keine Notizen", zh: "无笔记", ja: "メモなし" },

  // ── Layout manager ─────────────────────────────────────────────────────
  "lm.title": { en: "Chart layouts", ru: "Раскладки графика", es: "Diseños del gráfico", fr: "Mises en page du graphique", de: "Chart-Layouts", zh: "图表布局", ja: "チャートレイアウト" },
  "lm.autosave": { en: "Auto-save", ru: "Автосохранение", es: "Autoguardado", fr: "Sauvegarde auto", de: "Automatisch speichern", zh: "自动保存", ja: "自動保存" },
  "lm.namePh": { en: "Layout name", ru: "Название раскладки", es: "Nombre del diseño", fr: "Nom de la mise en page", de: "Layoutname", zh: "布局名称", ja: "レイアウト名" },
  "lm.save": { en: "Save", ru: "Сохранить", es: "Guardar", fr: "Enregistrer", de: "Speichern", zh: "保存", ja: "保存" },
  "lm.empty": { en: "No saved layouts", ru: "Нет сохранённых раскладок", es: "Sin diseños guardados", fr: "Aucune mise en page enregistrée", de: "Keine gespeicherten Layouts", zh: "无已保存布局", ja: "保存済みレイアウトなし" },

  // ── Script editor ──────────────────────────────────────────────────────
  "se.title": { en: "Indicator editor", ru: "Редактор индикаторов", es: "Editor de indicadores", fr: "Éditeur d'indicateurs", de: "Indikator-Editor", zh: "指标编辑器", ja: "インジケーターエディタ" },
  "se.desc": { en: "Custom JavaScript indicator. Available: TA, dataList, params. Return an array of objects (one per candle).", ru: "Пользовательский индикатор на JavaScript. Доступны: TA, dataList, params. Верните массив объектов (по одному на свечу).", es: "Indicador JavaScript personalizado. Disponibles: TA, dataList, params. Devuelve un array de objetos (uno por vela).", fr: "Indicateur JavaScript personnalisé. Disponibles : TA, dataList, params. Retournez un tableau d'objets (un par bougie).", de: "Eigener JavaScript-Indikator. Verfügbar: TA, dataList, params. Gib ein Array von Objekten zurück (eines pro Kerze).", zh: "自定义 JavaScript 指标。可用：TA、dataList、params。返回对象数组（每根K线一个）。", ja: "カスタム JavaScript インジケーター。利用可能：TA、dataList、params。各足ごとにオブジェクトの配列を返します。" },
  "se.namePh": { en: "Name", ru: "Название", es: "Nombre", fr: "Nom", de: "Name", zh: "名称", ja: "名前" },
  "se.paramsPh": { en: "Params: 14, 26, 9", ru: "Параметры: 14, 26, 9", es: "Parámetros: 14, 26, 9", fr: "Paramètres : 14, 26, 9", de: "Parameter: 14, 26, 9", zh: "参数：14, 26, 9", ja: "パラメータ：14, 26, 9" },
  "se.onChart": { en: "On chart", ru: "На графике", es: "En el gráfico", fr: "Sur le graphique", de: "Im Chart", zh: "主图", ja: "メイン" },
  "se.inPane": { en: "In pane", ru: "В панели", es: "En panel", fr: "Dans un volet", de: "Im Bereich", zh: "副图", ja: "サブ" },
  "se.run": { en: "Run", ru: "Запустить", es: "Ejecutar", fr: "Exécuter", de: "Ausführen", zh: "运行", ja: "実行" },
  "se.remove": { en: "Remove", ru: "Убрать", es: "Quitar", fr: "Retirer", de: "Entfernen", zh: "移除", ja: "削除" },
  "se.reset": { en: "Reset", ru: "Сброс", es: "Restablecer", fr: "Réinitialiser", de: "Zurücksetzen", zh: "重置", ja: "リセット" },
  "se.export": { en: "Export", ru: "Экспорт", es: "Exportar", fr: "Exporter", de: "Exportieren", zh: "导出", ja: "書き出し" },
  "se.import": { en: "Import", ru: "Импорт", es: "Importar", fr: "Importer", de: "Importieren", zh: "导入", ja: "読み込み" },

  // ── Screenshot dialog ──────────────────────────────────────────────────
  "ss.title": { en: "Chart snapshot", ru: "Снимок графика", es: "Captura del gráfico", fr: "Capture du graphique", de: "Chart-Schnappschuss", zh: "图表快照", ja: "チャートスナップショット" },
  "ss.preparing": { en: "Preparing snapshot…", ru: "Подготовка снимка…", es: "Preparando captura…", fr: "Préparation de la capture…", de: "Schnappschuss wird erstellt…", zh: "正在准备快照…", ja: "スナップショットを準備中…" },
  "ss.copy": { en: "Copy", ru: "Копировать", es: "Copiar", fr: "Copier", de: "Kopieren", zh: "复制", ja: "コピー" },
  "ss.copied": { en: "Copied", ru: "Скопировано", es: "Copiado", fr: "Copié", de: "Kopiert", zh: "已复制", ja: "コピーしました" },
  "ss.download": { en: "Download", ru: "Скачать", es: "Descargar", fr: "Télécharger", de: "Herunterladen", zh: "下载", ja: "ダウンロード" },

  // ── Symbol search ──────────────────────────────────────────────────────
  "sy.title": { en: "Symbol search", ru: "Поиск инструмента", es: "Buscar símbolo", fr: "Recherche de symbole", de: "Symbolsuche", zh: "品种搜索", ja: "銘柄検索" },
  "sy.searchPh": { en: "Search symbol (BTC, ETH, SOL…)", ru: "Поиск символа (BTC, ETH, SOL…)", es: "Buscar símbolo (BTC, ETH, SOL…)", fr: "Rechercher un symbole (BTC, ETH, SOL…)", de: "Symbol suchen (BTC, ETH, SOL…)", zh: "搜索品种（BTC, ETH, SOL…）", ja: "銘柄を検索（BTC, ETH, SOL…）" },
  "sy.searching": { en: "Searching…", ru: "Поиск…", es: "Buscando…", fr: "Recherche…", de: "Suche…", zh: "搜索中…", ja: "検索中…" },
  "sy.empty": { en: "Nothing found", ru: "Ничего не найдено", es: "No se encontró nada", fr: "Aucun résultat", de: "Nichts gefunden", zh: "未找到", ja: "見つかりません" },
  "sy.all": { en: "All", ru: "Все", es: "Todos", fr: "Tous", de: "Alle", zh: "全部", ja: "すべて" },

  // ── Timezone ───────────────────────────────────────────────────────────
  "tz.title": { en: "Timezone", ru: "Часовой пояс", es: "Zona horaria", fr: "Fuseau horaire", de: "Zeitzone", zh: "时区", ja: "タイムゾーン" },

  // ── Watchlist ──────────────────────────────────────────────────────────
  "wl.title": { en: "Watchlist", ru: "Список наблюдения", es: "Lista de seguimiento", fr: "Liste de suivi", de: "Beobachtungsliste", zh: "自选列表", ja: "ウォッチリスト" },
  "wl.addPh": { en: "Add symbol…", ru: "Добавить символ…", es: "Añadir símbolo…", fr: "Ajouter un symbole…", de: "Symbol hinzufügen…", zh: "添加品种…", ja: "銘柄を追加…" },
  "wl.remove": { en: "Remove {ticker}", ru: "Удалить {ticker}", es: "Eliminar {ticker}", fr: "Supprimer {ticker}", de: "{ticker} entfernen", zh: "删除 {ticker}", ja: "{ticker} を削除" },

  // ── Symbol info panel ──────────────────────────────────────────────────
  "si.title": { en: "Symbol info", ru: "Об инструменте", es: "Información", fr: "Infos", de: "Symbolinfo", zh: "品种信息", ja: "銘柄情報" },
  "si.spot": { en: "Spot", ru: "Спот", es: "Spot", fr: "Spot", de: "Spot", zh: "现货", ja: "現物" },
  "si.keyData": { en: "Key data", ru: "Основные данные", es: "Datos clave", fr: "Données clés", de: "Kennzahlen", zh: "关键数据", ja: "主要データ" },
  "si.volBar": { en: "Volume (bar)", ru: "Объём (бар)", es: "Volumen (barra)", fr: "Volume (barre)", de: "Volumen (Balken)", zh: "成交量（当前）", ja: "出来高（バー）" },
  "si.avgVol": { en: "Avg volume (30d)", ru: "Ср. объём (30д)", es: "Vol. medio (30d)", fr: "Vol. moyen (30j)", de: "Ø Volumen (30T)", zh: "平均成交量（30天）", ja: "平均出来高（30日）" },
  "si.turnover": { en: "Turnover", ru: "Оборот", es: "Volumen negociado", fr: "Volume d'échange", de: "Umsatz", zh: "成交额", ja: "売買代金" },
  "si.dynamics": { en: "Performance", ru: "Динамика", es: "Rendimiento", fr: "Performance", de: "Performance", zh: "涨跌幅", ja: "パフォーマンス" },
  "si.techAnalysis": { en: "Technicals", ru: "Теханализ", es: "Análisis técnico", fr: "Analyse technique", de: "Technische Analyse", zh: "技术分析", ja: "テクニカル" },
  "si.notEnough": { en: "Not enough data", ru: "Недостаточно данных", es: "Datos insuficientes", fr: "Données insuffisantes", de: "Nicht genug Daten", zh: "数据不足", ja: "データ不足" },
  "si.strongBuy": { en: "Strong buy", ru: "Активно покупать", es: "Compra fuerte", fr: "Achat fort", de: "Stark kaufen", zh: "强力买入", ja: "強い買い" },
  "si.buy": { en: "Buy", ru: "Покупать", es: "Comprar", fr: "Acheter", de: "Kaufen", zh: "买入", ja: "買い" },
  "si.neutral": { en: "Neutral", ru: "Нейтрально", es: "Neutral", fr: "Neutre", de: "Neutral", zh: "中性", ja: "中立" },
  "si.sell": { en: "Sell", ru: "Продавать", es: "Vender", fr: "Vendre", de: "Verkaufen", zh: "卖出", ja: "売り" },
  "si.strongSell": { en: "Strong sell", ru: "Активно продавать", es: "Venta fuerte", fr: "Vente forte", de: "Stark verkaufen", zh: "强力卖出", ja: "強い売り" },
  "si.sellCount": { en: "{n} sell", ru: "{n} прод.", es: "{n} venta", fr: "{n} vente", de: "{n} Verk.", zh: "{n} 卖", ja: "{n} 売" },
  "si.neutralCount": { en: "{n} neutral", ru: "{n} нейтр.", es: "{n} neutral", fr: "{n} neutre", de: "{n} neutral", zh: "{n} 中性", ja: "{n} 中立" },
  "si.buyCount": { en: "{n} buy", ru: "{n} пок.", es: "{n} compra", fr: "{n} achat", de: "{n} Kauf", zh: "{n} 买", ja: "{n} 買" },
  "si.w1": { en: "1W", ru: "1Н", es: "1S", fr: "1S", de: "1W", zh: "1周", ja: "1週" },
  "si.m1": { en: "1M", ru: "1М", es: "1M", fr: "1M", de: "1M", zh: "1月", ja: "1ヶ月" },
  "si.m3": { en: "3M", ru: "3М", es: "3M", fr: "3M", de: "3M", zh: "3月", ja: "3ヶ月" },
  "si.m6": { en: "6M", ru: "6М", es: "6M", fr: "6M", de: "6M", zh: "6月", ja: "6ヶ月" },
  "si.ytd": { en: "YTD", ru: "YTD", es: "YTD", fr: "Cumul", de: "lfd. Jahr", zh: "年初至今", ja: "年初来" },
  "si.y1": { en: "1Y", ru: "1Г", es: "1A", fr: "1A", de: "1J", zh: "1年", ja: "1年" },

  // ── Replay controls (aria) ─────────────────────────────────────────────
  "rp.back": { en: "Back", ru: "Назад", es: "Atrás", fr: "Précédent", de: "Zurück", zh: "后退", ja: "戻る" },
  "rp.playPause": { en: "Play / pause", ru: "Пауза/пуск", es: "Reproducir / pausar", fr: "Lecture / pause", de: "Wiedergabe / Pause", zh: "播放/暂停", ja: "再生/一時停止" },
  "rp.forward": { en: "Forward", ru: "Вперёд", es: "Adelante", fr: "Suivant", de: "Vorwärts", zh: "前进", ja: "進む" },
  "rp.stop": { en: "Stop", ru: "Стоп", es: "Detener", fr: "Arrêter", de: "Stopp", zh: "停止", ja: "停止" },

  // ── Status bar ─────────────────────────────────────────────────────────
  "sb.measureHint": { en: "Measure: click two points", ru: "Линейка: кликните две точки", es: "Medir: haz clic en dos puntos", fr: "Mesure : cliquez deux points", de: "Messen: zwei Punkte klicken", zh: "测量：点击两个点", ja: "計測：2点をクリック" },
  "sb.auto": { en: " (auto)", ru: " (авто)", es: " (auto)", fr: " (auto)", de: " (auto)", zh: "（自动）", ja: "（自動）" },
  "sb.escHint": { en: "Esc to cancel · Ctrl+Z/Y undo/redo", ru: "Esc — отмена · Ctrl+Z/Y — отмена/повтор", es: "Esc para cancelar · Ctrl+Z/Y deshacer/rehacer", fr: "Échap pour annuler · Ctrl+Z/Y annuler/rétablir", de: "Esc zum Abbrechen · Ctrl+Z/Y rückgängig/wiederholen", zh: "Esc 取消 · Ctrl+Z/Y 撤销/重做", ja: "Esc で取消 · Ctrl+Z/Y で取消/やり直し" },
  "sb.bars": { en: "bars", ru: "баров", es: "barras", fr: "barres", de: "Balken", zh: "根", ja: "本" },

  // ── Buy / Sell ─────────────────────────────────────────────────────────
  "trade.sell": { en: "Sell", ru: "Продать", es: "Vender", fr: "Vendre", de: "Verkaufen", zh: "卖出", ja: "売り" },
  "trade.buy": { en: "Buy", ru: "Купить", es: "Comprar", fr: "Acheter", de: "Kaufen", zh: "买入", ja: "買い" },

  // ── Candle types ───────────────────────────────────────────────────────
  "candle.candle_solid": { en: "Candles", ru: "Свечи", es: "Velas", fr: "Bougies", de: "Kerzen", zh: "实心K线", ja: "ローソク足" },
  "candle.candle_stroke": { en: "Hollow candles", ru: "Полые свечи", es: "Velas huecas", fr: "Bougies creuses", de: "Hohle Kerzen", zh: "空心K线", ja: "中空ローソク" },
  "candle.candle_up_stroke": { en: "Hollow up", ru: "Полые вверх", es: "Huecas alcistas", fr: "Creuses hausse", de: "Hohl steigend", zh: "上涨空心", ja: "上昇中空" },
  "candle.candle_down_stroke": { en: "Hollow down", ru: "Полые вниз", es: "Huecas bajistas", fr: "Creuses baisse", de: "Hohl fallend", zh: "下跌空心", ja: "下降中空" },
  "candle.ohlc": { en: "Bars (OHLC)", ru: "Бары (OHLC)", es: "Barras (OHLC)", fr: "Barres (OHLC)", de: "Balken (OHLC)", zh: "美国线 (OHLC)", ja: "バー (OHLC)" },
  "candle.area": { en: "Area", ru: "Линия (область)", es: "Área", fr: "Aire", de: "Fläche", zh: "面积图", ja: "エリア" },

  // ── Price axis types ───────────────────────────────────────────────────
  "axis.normal": { en: "Normal", ru: "Обычная", es: "Normal", fr: "Normale", de: "Normal", zh: "普通", ja: "通常" },
  "axis.percentage": { en: "Percentage", ru: "Процентная", es: "Porcentaje", fr: "Pourcentage", de: "Prozent", zh: "百分比", ja: "パーセント" },
  "axis.logarithm": { en: "Logarithmic", ru: "Логарифмическая", es: "Logarítmica", fr: "Logarithmique", de: "Logarithmisch", zh: "对数", ja: "対数" },

  // ── Y-axis position ────────────────────────────────────────────────────
  "ypos.left": { en: "Left", ru: "Слева", es: "Izquierda", fr: "Gauche", de: "Links", zh: "左侧", ja: "左" },
  "ypos.right": { en: "Right", ru: "Справа", es: "Derecha", fr: "Droite", de: "Rechts", zh: "右侧", ja: "右" },

  // ── Tooltip rule ───────────────────────────────────────────────────────
  "trule.always": { en: "Always", ru: "Всегда", es: "Siempre", fr: "Toujours", de: "Immer", zh: "始终", ja: "常に" },
  "trule.follow_cross": { en: "On crosshair", ru: "По перекрестию", es: "Con la mira", fr: "Au réticule", de: "Beim Fadenkreuz", zh: "跟随光标", ja: "十字カーソル時" },
  "trule.none": { en: "Hide", ru: "Скрывать", es: "Ocultar", fr: "Masquer", de: "Ausblenden", zh: "隐藏", ja: "非表示" },
};

// Merge the additional-language dictionaries into the catalog once at load.
for (const [lang, dict] of Object.entries(extraDicts)) {
  if (!dict) continue;
  for (const [key, value] of Object.entries(dict)) {
    if (messages[key]) messages[key][lang as Lang] = value;
  }
}

/** Resolve a key for a language with English/key fallback + `{param}` interpolation. */
export function translate(lang: Lang, key: string, params?: Record<string, string | number>): string {
  const entry = messages[key];
  let str = entry ? (entry[lang] ?? entry.en) : key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return str;
}
