from tkinter import *
from tkinter import filedialog

def openFile():
    filepath = filedialog.askopenfilename(title="Localize o arquivo CSV",
                                          filetypes=(
                                                        ("csv files", "*.csv"),
                                                        ("text files", "*.txt")
                                                    )
                                          )
    print(filepath)

openFile()