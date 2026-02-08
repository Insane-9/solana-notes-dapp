"use client"

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { useEffect, useState } from "react";

const PROGRAM_ID = new PublicKey("AZU5xiTxwuTbp5ixiN7mxoGVy6BCzhFEJFpCSvyffowc");

const IDL = {
  "address": "AZU5xiTxwuTbp5ixiN7mxoGVy6BCzhFEJFpCSvyffowc",
  "metadata": {
    "name": "notes_dapp",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "create_note",
      "discriminator": [
        103,
        2,
        208,
        242,
        86,
        156,
        151,
        107
      ],
      "accounts": [
        {
          "name": "note",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  111,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "author"
              },
              {
                "kind": "arg",
                "path": "title"
              }
            ]
          }
        },
        {
          "name": "author",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "content",
          "type": "string"
        }
      ]
    },
    {
      "name": "delete_note",
      "discriminator": [
        182,
        211,
        115,
        229,
        163,
        88,
        108,
        217
      ],
      "accounts": [
        {
          "name": "note",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  111,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "author"
              },
              {
                "kind": "account",
                "path": "note.title",
                "account": "Note"
              }
            ]
          }
        },
        {
          "name": "author",
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "update_note",
      "discriminator": [
        103,
        129,
        251,
        34,
        33,
        154,
        210,
        148
      ],
      "accounts": [
        {
          "name": "note",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  110,
                  111,
                  116,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "author"
              },
              {
                "kind": "account",
                "path": "note.title",
                "account": "Note"
              }
            ]
          }
        },
        {
          "name": "author",
          "signer": true
        }
      ],
      "args": [
        {
          "name": "content",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "Note",
      "discriminator": [
        203,
        75,
        252,
        196,
        81,
        210,
        122,
        126
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "TitleTooLong",
      "msg": "Title cannot be longer than 100 chars"
    },
    {
      "code": 6001,
      "name": "ContentTooLong",
      "msg": "Content cannot be longer than 1000 chars"
    },
    {
      "code": 6002,
      "name": "TitleEmpty",
      "msg": "Title cannot be empty"
    },
    {
      "code": 6003,
      "name": "ContentEmpty",
      "msg": "Content cannot be empty"
    },
    {
      "code": 6004,
      "name": "Unauthorized",
      "msg": "Unauthorized"
    }
  ],
  "types": [
    {
      "name": "Note",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "author",
            "type": "pubkey"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "content",
            "type": "string"
          },
          {
            "name": "created_at",
            "type": "i64"
          },
          {
            "name": "last_updated",
            "type": "i64"
          }
        ]
      }
    }
  ]
}

export default function Home() {
  const {connection} = useConnection();
  const wallet = useWallet();

  const [notes,setNotes] = useState<any[]>([]);
  const [loading,setLoading] = useState(false);
  const [message,setMessage] = useState("");

  const [title,setTitle] = useState("");
  const [content,setContent] = useState("");

  const [editContent,setEditContent] = useState("")
  const [editNote,setEditNote] = useState<any>(null);


  const getProgram = ()=>{
    if(!wallet.publicKey || !wallet.signTransaction) return null;
    const provider = new AnchorProvider(connection, wallet as any, AnchorProvider.defaultOptions());
    const program = new Program(IDL as any, provider);
    return program;
  }

  const getNoteAddress = (title: String)=>{
    if(!wallet.publicKey || !wallet.signTransaction) return null;
    const [noteAddress] = PublicKey.findProgramAddressSync([Buffer.from("note"),wallet.publicKey.toBuffer(),Buffer.from(title)],PROGRAM_ID)
    return noteAddress;
  }

  // Functions to be created : 

  // load the notes 
  const loadNotes = async ()=>{
    if (!wallet.publicKey) return;
    setLoading(true);
    try {
      let program = getProgram()
      if(!program) return;
      const notes = await (program.account as any).note.all([
        {
          memcmp: {
            offset: 8, // discriminato r size
            bytes: wallet.publicKey.toBase58()
          }
        }
      ]);
    
      console.log("User's notes:", notes);
      setNotes(notes);
      setMessage("")
    } catch (error) {
      console.log("Error Loading notes", error);
      setMessage("Error Loading the notes");
    }
    setLoading(false);
  }

  // create the notes 

  const createNote = async ()=>{
    if(!title.trim() || !content.trim()){
      setMessage("Please fill in the title or content");
      return;
    }
    if(title.length>100){
      setMessage("Title too long. Maximum length = 100 characters.");
      return;
    }
    if(content.length>1000){
      setMessage("Content too long. Maximum length = 1000 characters");
      return;
    }
    setLoading(true);

    try {
      const program = getProgram();
      if(!program) return;

      if(!wallet.publicKey) {
        setMessage("Wallet not connected");
        setLoading(false);
        return;
      }

      const noteAddress = getNoteAddress(title);
      if(!noteAddress) return

      await program.methods.createNote(title, content)
        .accounts({
          note: noteAddress,
          author: wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setMessage("Note created successfully");
      setTitle("")
      setContent("")
      await loadNotes();

    } catch (error) {
      console.log("Error creating note, Error:",error);
      setMessage("Error creating note");
    }
    setLoading(false)
  }

  // update the notes 

  const updateNote = async (note:any)=>{
    if(!editContent.trim()) return;
    if(editContent.length>1000) return;
    setLoading(true)
    try {
      const program = getProgram();
      if(!program) return;
      if(!wallet.publicKey) return;
      const noteAddress = getNoteAddress(note.account.title);

      if(!noteAddress) return;

      await program.methods.updateNote(editContent).accounts({
        note:noteAddress,
        author:wallet.publicKey
      }).rpc()

      setMessage("successfully updated note");
      setEditContent("")
      setEditNote(null)

      await loadNotes()
      
    } catch (error) {
      console.log("Error while updating note, Error : ", error);
      setMessage("Error updating note");
    }
    setLoading(false)
  }

  // delete the notes
  
  const deleteNote = async (note:any)=>{
    setLoading(true);
    try {
      const program = getProgram()
      if(!program) return
      if(!wallet.publicKey) return
      const noteAddress = getNoteAddress(note.account.title);
      if(!noteAddress) return

      await program.methods.deleteNote().accounts({
        note:noteAddress,
        author:wallet.publicKey
      }).rpc()

      setMessage("Note deleted successfully")
      await loadNotes();
    } catch (error) {
      console.log("Error deleting note, Error : ",error);
      setMessage("Error deleting this note")
    }
    setLoading(false);
  }

  useEffect(()=>{
    if(wallet.connected)
      loadNotes()
  },[wallet.connected])

  

  if(!wallet.connected){
    return <div className="text-gray-700">Please Connect Wallet</div>
  }

  return <div className="text-gray-900">
    <div>
      <h2 className="text-3xl mb-6">
        Create New Note
      </h2>
      <div>
        <label className="text-2xl block font-medium" htmlFor="title">Title <span className="text-sm">({title.length}/100)</span></label>
        <input type="text" name="title" id="title" value={title} onChange={(e)=>{
          setTitle(e.target.value)
        }} className="border-2 border-black p-1 w-full" placeholder="Enter Title:" />
      </div>
      <div>
        <label className="text-2xl block font-medium" htmlFor="content">Content <span className="text-sm">({content.length}/1000)</span></label>
        <textarea maxLength={1000} rows={5} name="content" id="content" value={content} onChange={(e)=>{
          setContent(e.target.value)
        }} className="border-2 border-black p-1 h-32 w-full" placeholder="Enter Content:" />
      </div>
      <button disabled={loading || !title.trim() || !content.trim()} className="bg-blue-800 w-full rounded-4xl text-amber-50 py-2 mx-auto font-extrabold disabled:bg-blue-300 disabled:cursor-not-allowed hover:cursor-grab" onClick={createNote}>{loading? "Creating Note":"Create Note"}</button>
    </div>
    <div>
      {notes?.map((note:any)=>{
        return <div>
          <div className="mb-6 mt-6 border-2 border-gray-500 rounded-2xl p-3 " key={note.account.author}>
            <h3 className="text-xl font-bold">{note.account.title}</h3>
            <p className="">{note.account.content}</p>
            <div>Created At: {new Date(note.account.createdAt.toNumber()).toLocaleString()}</div>
            <div>Last Updated at: {new Date(note.account.lastUpdated.toNumber()).toLocaleString()}</div>

            {editNote?(
              <div>
                <textarea maxLength={1000} rows={5} name="update_content" id="update_content" value={editContent} onChange={(e)=>{
                setEditContent(e.target.value)
                }} className="border-2 border-black p-1 h-32 w-full" placeholder="Enter Updated Content:" />
              </div>
            ):null}

            <div className="flex gap-4 p-2">
              <button className="border-2 p-2 rounded-sm hover:bg-violet-800 hover:text-amber-50 hover:cursor-auto" onClick={()=>{
                if(!editNote){
                  setEditNote(note);
                  setEditContent(note.account.content)
                }else{
                  updateNote(note)
                }
              }}>{editNote?"Save":"Edit"}</button>
              <button className="border-2 p-2 rounded-sm hover:bg-violet-800 hover:text-amber-50 hover:cursor-auto" onClick={()=>deleteNote(note)}>Delete</button>
              {editNote?(
                <button className="border-2 p-2 rounded-sm hover:bg-violet-800 hover:text-amber-50 hover:cursor-auto" onClick={()=>setEditNote(null)}>Close</button>
              ):null}
            </div>
          </div>
        </div>
      })}
    </div>
  </div>
}