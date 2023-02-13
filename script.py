from tkinter import *
from tkinter import filedialog
import pandas as pd


def openFile():
    filepath = filedialog.askopenfilename(title="Localize o arquivo CSV",
                                          filetypes=(
                                                        ("csv files", "*.csv"),
                                                        ("text files", "*.txt")
                                                    )
                                          )
    print(filepath)

openFile()