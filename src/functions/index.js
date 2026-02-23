// functions/index.js

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();

// Define a região padrão para as funções (ex: Europa)
setGlobalOptions({ region: "europe-west1" });

/**
 * PROVISIONAMENTO REAL DE UTILIZADOR
 * Esta função cria o utilizador no Auth, define as Claims e cria o perfil no Firestore.
 */
exports.inviteTeamMember = onCall(async (request) => {
  // 1. Verificação de Segurança: Apenas OWNER ou MANAGER podem convidar
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Utilizador não autenticado.");
  }

  const callerUid = request.auth.uid;
  const { fullName, email, role, businessId, phone } = request.data;

  // Busca o perfil de quem está a chamar para validar permissão
  const callerSnap = await admin.firestore()
    .doc(`businesses/${businessId}/users/${callerUid}`)
    .get();

  const callerData = callerSnap.data();
  if (!callerData || (callerData.role !== "OWNER" && callerData.role !== "MANAGER")) {
    throw new HttpsError("permission-denied", "Não tem permissões para convidar membros.");
  }

  try {
    // 2. Criar utilizador no Firebase Auth com senha temporária
    const tempPassword = "Nails" + Math.random().toString(36).slice(-8) + "!";
    const userRecord = await admin.auth().createUser({
      email,
      password: tempPassword,
      displayName: fullName,
      disabled: false,
    });

    const uid = userRecord.uid;

    // 3. Definir Custom Claims (O "Selo de Segurança" no Token)
    // Isto permite que as Firestore Rules validem o acesso sem ler documentos
    await admin.auth().setCustomUserClaims(uid, {
      role: role,
      businessId: businessId
    });

    // 4. Criar o documento de perfil no Firestore (Substituindo o UID Fake)
    const userData = {
      uid: uid,
      businessId: businessId,
      fullName: fullName,
      email: email,
      phone: phone || "",
      role: role,
      status: "ACTIVE",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await admin.firestore()
      .doc(`businesses/${businessId}/users/${uid}`)
      .set(userData);

    // 5. Registar Auditoria
    await admin.firestore()
      .collection(`businesses/${businessId}/auditLogs`)
      .add({
        actorUid: callerUid,
        action: "USER_INVITED",
        targetUid: uid,
        details: `Utilizador ${fullName} convidado como ${role}.`,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

    return { 
      success: true, 
      uid: uid, 
      tempPassword: tempPassword // Em produção, isto seria enviado por email
    };

  } catch (error) {
    console.error("Erro ao convidar membro:", error);
    if (error.code === 'auth/email-already-in-use') {
      throw new HttpsError("already-exists", "Este email já está em uso.");
    }
    throw new HttpsError("internal", error.message);
  }
});