from typing import Dict, List, Tuple
import openpyxl, os
from openpyxl import Workbook
from openpyxl.worksheet.worksheet import Worksheet
from openpyxl.cell.cell import Cell



APPDATA = os.getenv('appdata')
file_name: str | None = None
workbook: Workbook | None = None

class TextDTO:
    history: List[str]
    def __init__(self, DTO: Dict[str, str]):
        self.window_title = DTO["window_title"]
        self.originalText = DTO["originalText"]
        self.translatedText = DTO["translatedText"] if "translatedText" in DTO else None


def loadFile(name: str): 
    global workbook, file_name
    file_name = name
    try: workbook = openpyxl.load_workbook(filePath())
    except: 
        workbook = Workbook()
        workbook.active.title = 'Translation'

def worksheet() -> Worksheet: 
    if workbook is not None: return workbook['Translation']

def filePath() -> str: return os.path.join(APPDATA, 'ai-translate', file_name+'.xlsx')

def queryEntry(textDTO: TextDTO):
    if isinstance(textDTO, TextDTO) and textDTO.window_title is not None:
        if textDTO.window_title != file_name or worksheet() is None: loadFile(textDTO.window_title)
        if worksheet() is not None:
            column: Tuple[Cell] = worksheet()['A']
            for cell in column:
                if cell.value is not None and textDTO.originalText in cell.value: return cell.row

def get_history(lastRowNumber: int):
    if isinstance(lastRowNumber, int) and lastRowNumber is not None:
        history = []
        rowNumber = lastRowNumber
        while len(history) < 10:
            rowNumber = rowNumber-1
            if rowNumber > 0:
                cell = worksheet().cell(row= rowNumber, column=2)
                if cell.value is not None and cell.value != "": history.append(cell.value)
            else: break
        
        return history



class XLSX:
    def QueryTranslation(self, textDTO: Dict[str, str]) -> TextDTO: 
        textDTO: TextDTO = TextDTO(textDTO)
        entry = queryEntry(textDTO)
        if entry is not None: 
            cell = worksheet().cell(row= entry, column=2)
            textDTO.translatedText = cell.value
            return textDTO.__dict__
        
        textDTO.history = get_history(worksheet().max_row+1)
        return textDTO.__dict__


    def SaveText(self, textDTO: Dict[str, str]):
        textDTO: TextDTO = TextDTO(textDTO)
        entry = queryEntry(textDTO)
        if entry is not None and worksheet() is not None: 
            cell = worksheet().cell(row= entry, column=2)
            cell.value = textDTO.translatedText

        elif worksheet() is not None: 
            lastRow = worksheet().max_row+1 # same variable for both calls to avoid the "stairs" bug
            cellA = worksheet().cell(row= lastRow, column=1)
            cellB = worksheet().cell(row= lastRow, column=2)
            cellA.value = textDTO.originalText
            cellB.value = textDTO.translatedText
        
        else: return

        workbook.save(filePath())


